from datetime import datetime
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.models.user import User
from app.models.calendar_integration import CalendarIntegration
from app.schemas.calendar_integration import (
    CalendarIntegrationListResponse,
    OAuthInitRequest,
    OAuthInitResponse,
)

router = APIRouter()


def _google_oauth_url(state: str) -> str:
    if not settings.GOOGLE_CALENDAR_CLIENT_ID or not settings.GOOGLE_CALENDAR_REDIRECT_URI:
        raise HTTPException(
            status_code=400,
            detail="Google Calendar OAuth is not configured. Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_REDIRECT_URI.",
        )
    params = {
        "client_id": settings.GOOGLE_CALENDAR_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_CALENDAR_REDIRECT_URI,
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent",
        "scope": settings.GOOGLE_CALENDAR_SCOPES,
        "state": state,
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


@router.get("", response_model=CalendarIntegrationListResponse)
@router.get("/", response_model=CalendarIntegrationListResponse)
def list_calendar_integrations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    items = (
        db.query(CalendarIntegration)
        .filter(
            CalendarIntegration.organization_id == current_user.organization_id,
            CalendarIntegration.user_id == current_user.id,
            CalendarIntegration.is_active == True,
        )
        .order_by(CalendarIntegration.updated_at.desc())
        .all()
    )
    return CalendarIntegrationListResponse(items=items, total=len(items))


@router.post("/oauth/init", response_model=OAuthInitResponse)
def init_calendar_oauth(
    *,
    payload: OAuthInitRequest,
    current_user: User = Depends(deps.get_current_active_user),
):
    provider = (payload.provider or "google").lower().strip()
    if provider != "google":
        raise HTTPException(
            status_code=400,
            detail="Only Google OAuth init is enabled right now. Outlook/Apple/CalDAV are in next rollout.",
        )
    state = f"{current_user.id}:{current_user.organization_id}:{int(datetime.utcnow().timestamp())}"
    return OAuthInitResponse(
        authorization_url=_google_oauth_url(state=state),
        provider="google",
    )


@router.post("/{integration_id}/disconnect")
def disconnect_calendar_integration(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    integration_id: int,
):
    integration = (
        db.query(CalendarIntegration)
        .filter(
            CalendarIntegration.id == integration_id,
            CalendarIntegration.organization_id == current_user.organization_id,
            CalendarIntegration.user_id == current_user.id,
        )
        .first()
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    integration.is_active = False
    integration.sync_enabled = False
    integration.updated_at = datetime.utcnow()
    db.add(integration)
    db.commit()
    return {"success": True, "message": "Calendar integration disconnected"}


@router.post("/{integration_id}/sync")
def trigger_calendar_sync(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    integration_id: int,
):
    integration = (
        db.query(CalendarIntegration)
        .filter(
            CalendarIntegration.id == integration_id,
            CalendarIntegration.organization_id == current_user.organization_id,
            CalendarIntegration.user_id == current_user.id,
            CalendarIntegration.is_active == True,
        )
        .first()
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    integration.last_synced_at = datetime.utcnow()
    integration.last_error = None
    integration.updated_at = datetime.utcnow()
    db.add(integration)
    db.commit()
    return {"success": True, "message": "Sync queued", "integration_id": integration.id}
