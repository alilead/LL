from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.calendar_integration import CalendarIntegration
from app.models.calendar_event_link import CalendarEventLink
from app.models.event import Event


def _parse_google_dt(item: Dict[str, Any], key: str) -> tuple[datetime, bool]:
    src = item.get(key, {}) or {}
    if "date" in src:
        dt = datetime.strptime(src["date"], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        return dt, True
    raw = (src.get("dateTime") or "").replace("Z", "+00:00")
    dt = datetime.fromisoformat(raw) if raw else datetime.now(timezone.utc)
    return dt, False


def _to_google_event_payload(ev: Event) -> Dict[str, Any]:
    if ev.is_all_day:
        return {
            "summary": ev.title,
            "description": ev.description or "",
            "location": ev.location or "",
            "start": {"date": ev.start_date.date().isoformat()},
            "end": {"date": ev.end_date.date().isoformat()},
        }
    tz = ev.timezone or "UTC"
    return {
        "summary": ev.title,
        "description": ev.description or "",
        "location": ev.location or "",
        "start": {"dateTime": ev.start_date.isoformat(), "timeZone": tz},
        "end": {"dateTime": ev.end_date.isoformat(), "timeZone": tz},
    }


class GoogleCalendarSyncService:
    def __init__(self, db: Session):
        self.db = db

    def _refresh_access_token(self, integration: CalendarIntegration) -> str:
        if (
            integration.access_token
            and integration.token_expires_at
            and integration.token_expires_at > (datetime.utcnow() + timedelta(seconds=60))
        ):
            return integration.access_token
        if not integration.refresh_token:
            raise ValueError("Google refresh token is missing")
        token_resp = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CALENDAR_CLIENT_ID,
                "client_secret": settings.GOOGLE_CALENDAR_CLIENT_SECRET,
                "refresh_token": integration.refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=20,
        )
        if token_resp.status_code >= 400:
            raise ValueError(f"Google token refresh failed ({token_resp.status_code})")
        data = token_resp.json()
        access = data.get("access_token")
        if not access:
            raise ValueError("Google token refresh did not return access token")
        expires_in = int(data.get("expires_in") or 3600)
        integration.access_token = access
        integration.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        integration.updated_at = datetime.utcnow()
        self.db.add(integration)
        self.db.commit()
        return access

    def _google_get_events(self, access_token: str) -> list[dict]:
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {
            "calendarId": "primary",
            "singleEvents": True,
            "orderBy": "updated",
            "maxResults": 500,
            "timeMin": (datetime.utcnow() - timedelta(days=90)).isoformat() + "Z",
            "timeMax": (datetime.utcnow() + timedelta(days=365)).isoformat() + "Z",
        }
        resp = requests.get(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers=headers,
            params=params,
            timeout=30,
        )
        if resp.status_code >= 400:
            raise ValueError(f"Google events fetch failed ({resp.status_code})")
        return resp.json().get("items", []) or []

    def _google_create_event(self, access_token: str, ev: Event) -> dict:
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        payload = _to_google_event_payload(ev)
        resp = requests.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers=headers,
            json=payload,
            timeout=30,
        )
        if resp.status_code >= 400:
            raise ValueError(f"Google event create failed ({resp.status_code})")
        return resp.json()

    def _google_update_event(self, access_token: str, external_event_id: str, ev: Event) -> dict:
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        payload = _to_google_event_payload(ev)
        resp = requests.patch(
            f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{external_event_id}",
            headers=headers,
            json=payload,
            timeout=30,
        )
        if resp.status_code >= 400:
            raise ValueError(f"Google event update failed ({resp.status_code})")
        return resp.json()

    def sync_integration(self, integration: CalendarIntegration) -> dict:
        access_token = self._refresh_access_token(integration)
        google_items = self._google_get_events(access_token)
        now_utc = datetime.utcnow()
        created_internal = 0
        updated_internal = 0
        pushed_to_google = 0
        skipped = 0

        for item in google_items:
            external_id = item.get("id")
            if not external_id:
                continue
            link = (
                self.db.query(CalendarEventLink)
                .filter(
                    CalendarEventLink.integration_id == integration.id,
                    CalendarEventLink.external_event_id == external_id,
                )
                .first()
            )
            google_updated_raw = (item.get("updated") or "").replace("Z", "+00:00")
            google_updated = datetime.fromisoformat(google_updated_raw).replace(tzinfo=None) if google_updated_raw else now_utc

            if item.get("status") == "cancelled":
                if link and link.event_id:
                    ev = self.db.query(Event).filter(Event.id == link.event_id).first()
                    if ev:
                        ev.status = "cancelled"
                        ev.updated_at = now_utc
                        self.db.add(ev)
                    link.is_deleted = True
                    link.last_external_updated_at = google_updated
                    link.last_synced_at = now_utc
                    link.updated_at = now_utc
                    self.db.add(link)
                    self.db.commit()
                continue

            g_start, g_all_day = _parse_google_dt(item, "start")
            g_end, _ = _parse_google_dt(item, "end")
            g_title = item.get("summary") or "No title"
            g_desc = item.get("description") or ""
            g_location = item.get("location") or ""
            g_tz = (item.get("start", {}) or {}).get("timeZone") or "UTC"

            if link:
                ev = self.db.query(Event).filter(Event.id == link.event_id).first()
                if not ev:
                    skipped += 1
                    continue
                internal_updated = (ev.updated_at or ev.created_at or now_utc)
                # Conflict policy C: newest updated_at wins
                if google_updated > internal_updated:
                    ev.title = g_title
                    ev.description = g_desc
                    ev.location = g_location
                    ev.start_date = g_start
                    ev.end_date = g_end
                    ev.is_all_day = g_all_day
                    ev.timezone = g_tz
                    ev.updated_at = now_utc
                    self.db.add(ev)
                    updated_internal += 1
                elif internal_updated > google_updated:
                    updated = self._google_update_event(access_token, external_id, ev)
                    link.external_etag = updated.get("etag")
                    updated_ext_raw = (updated.get("updated") or "").replace("Z", "+00:00")
                    if updated_ext_raw:
                        link.last_external_updated_at = datetime.fromisoformat(updated_ext_raw).replace(tzinfo=None)
                    pushed_to_google += 1
                else:
                    skipped += 1

                link.last_internal_updated_at = ev.updated_at or internal_updated
                link.last_synced_at = now_utc
                link.updated_at = now_utc
                link.external_etag = item.get("etag") or link.external_etag
                self.db.add(link)
                self.db.commit()
            else:
                ev = Event(
                    title=g_title,
                    description=g_desc,
                    start_date=g_start,
                    end_date=g_end,
                    location=g_location,
                    event_type="meeting",
                    status="scheduled",
                    organization_id=integration.organization_id,
                    created_by=integration.user_id,
                    created_at=now_utc,
                    updated_at=now_utc,
                    is_all_day=g_all_day,
                    timezone=g_tz,
                )
                self.db.add(ev)
                self.db.commit()
                self.db.refresh(ev)

                link = CalendarEventLink(
                    integration_id=integration.id,
                    organization_id=integration.organization_id,
                    user_id=integration.user_id,
                    event_id=ev.id,
                    external_event_id=external_id,
                    external_calendar_id="primary",
                    external_etag=item.get("etag"),
                    last_external_updated_at=google_updated,
                    last_internal_updated_at=ev.updated_at,
                    last_synced_at=now_utc,
                    is_deleted=False,
                )
                self.db.add(link)
                self.db.commit()
                created_internal += 1

        # Push internal events not yet mapped
        linked_event_ids = {
            row[0]
            for row in self.db.query(CalendarEventLink.event_id)
            .filter(CalendarEventLink.integration_id == integration.id, CalendarEventLink.is_deleted == False)
            .all()
        }
        candidate_events = (
            self.db.query(Event)
            .filter(
                Event.organization_id == integration.organization_id,
                Event.created_by == integration.user_id,
                Event.status != "cancelled",
            )
            .all()
        )
        for ev in candidate_events:
            if ev.id in linked_event_ids:
                continue
            created = self._google_create_event(access_token, ev)
            updated_ext_raw = (created.get("updated") or "").replace("Z", "+00:00")
            link = CalendarEventLink(
                integration_id=integration.id,
                organization_id=integration.organization_id,
                user_id=integration.user_id,
                event_id=ev.id,
                external_event_id=created.get("id"),
                external_calendar_id="primary",
                external_etag=created.get("etag"),
                last_external_updated_at=datetime.fromisoformat(updated_ext_raw).replace(tzinfo=None) if updated_ext_raw else None,
                last_internal_updated_at=ev.updated_at,
                last_synced_at=now_utc,
                is_deleted=False,
            )
            self.db.add(link)
            self.db.commit()
            pushed_to_google += 1

        integration.last_synced_at = now_utc
        integration.last_error = None
        integration.updated_at = now_utc
        self.db.add(integration)
        self.db.commit()

        return {
            "created_internal": created_internal,
            "updated_internal": updated_internal,
            "pushed_to_google": pushed_to_google,
            "skipped": skipped,
            "total_external_seen": len(google_items),
        }
