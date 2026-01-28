from typing import Any, Dict, Optional, Union, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from app.crud.base import CRUDBase
from app.models.event import Event, EventAttendee
from app.schemas.event import EventCreate, EventUpdate
import logging

logger = logging.getLogger(__name__)

class CRUDEvent(CRUDBase[Event, EventCreate, EventUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: EventCreate, owner_id: int, user_id: int
    ) -> Event:
        obj_in_data = obj_in.model_dump()
        
        # Get timezone from input or use UTC
        event_timezone = obj_in_data.get("timezone", "UTC")
        
        # Ensure dates are timezone-aware
        start_date = obj_in_data["start_date"]
        end_date = obj_in_data["end_date"]
        
        if not start_date.tzinfo:
            start_date = start_date.replace(tzinfo=ZoneInfo(event_timezone))
        if not end_date.tzinfo:
            end_date = end_date.replace(tzinfo=ZoneInfo(event_timezone))
        
        now = datetime.now(ZoneInfo(event_timezone))
        
        create_data = {
            "title": obj_in_data["title"],
            "description": obj_in_data.get("description"),
            "event_type": obj_in_data["event_type"],
            "start_date": start_date,
            "end_date": end_date,
            "location": obj_in_data.get("location"),
            "is_all_day": obj_in_data.get("is_all_day", False),
            "lead_id": obj_in_data.get("lead_id"),
            "deal_id": obj_in_data.get("deal_id"),
            "organization_id": obj_in_data["organization_id"],
            "created_by": owner_id,
            "status": obj_in_data.get("status", "published"),
            "created_at": now,
            "updated_at": now,
            "timezone": event_timezone
        }
        
        db_obj = Event(**create_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Add attendees
        if attendee_ids := obj_in_data.get("attendee_ids"):
            for user_id in attendee_ids:
                attendee = EventAttendee(
                    event_id=db_obj.id,
                    user_id=user_id,
                    status="pending",
                    created_at=now,
                    updated_at=now
                )
                db.add(attendee)
            db.commit()
            db.refresh(db_obj)
        
        return db_obj

    def get_by_date_range(
        self,
        db: Session,
        *,
        organization_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> List[Event]:
        return (
            db.query(self.model)
            .filter(
                self.model.organization_id == organization_id,
                self.model.start_date >= start_date,
                self.model.end_date <= end_date
            )
            .order_by(self.model.start_date.asc())
            .all()
        )

    def get_multi_by_owner(
        self,
        db: Session,
        *,
        owner_id: int,
        start_date: datetime,
        end_date: datetime,
        lead_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Event]:
        query = db.query(self.model).filter(
            and_(
                Event.created_by == owner_id,
                Event.start_date >= start_date,
                Event.end_date <= end_date
            )
        )
        
        if lead_id:
            query = query.filter(Event.lead_id == lead_id)
        
        return query.order_by(Event.start_date).offset(skip).limit(limit).all()

    def get_multi_by_organization(
        self,
        db: Session,
        *,
        organization_id: int,
        start_date: datetime,
        end_date: datetime,
        lead_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Event]:
        # Ensure dates are timezone-aware with UTC if not specified
        if not start_date.tzinfo:
            start_date = start_date.replace(tzinfo=timezone.utc)
        if not end_date.tzinfo:
            end_date = end_date.replace(tzinfo=timezone.utc)
            
        query = db.query(self.model).filter(
            and_(
                Event.organization_id == organization_id,
                Event.start_date >= start_date,
                Event.end_date <= end_date
            )
        )
        
        if lead_id:
            query = query.filter(Event.lead_id == lead_id)
        
        events = query.order_by(Event.start_date).offset(skip).limit(limit).all()
        
        # Her event'ı kendi timezone'ında göster
        for event in events:
            if event.start_date and not event.start_date.tzinfo:
                event.start_date = event.start_date.replace(tzinfo=ZoneInfo(event.timezone))
            if event.end_date and not event.end_date.tzinfo:
                event.end_date = event.end_date.replace(tzinfo=ZoneInfo(event.timezone))
        
        return events

    def update(
        self, 
        db: Session, 
        *, 
        db_obj: Event, 
        obj_in: Union[EventUpdate, Dict[str, Any]]
    ) -> Event:
        update_data = obj_in.dict(exclude_unset=True) if isinstance(obj_in, EventUpdate) else obj_in
        
        # Get timezone from input or use existing
        event_timezone = update_data.get('timezone', db_obj.timezone)
        
        # Tarihleri güncelle
        if 'start_date' in update_data:
            start_date = update_data['start_date']
            if isinstance(start_date, str):
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if not start_date.tzinfo:
                start_date = start_date.replace(tzinfo=ZoneInfo(event_timezone))
            update_data['start_date'] = start_date
            
        if 'end_date' in update_data:
            end_date = update_data['end_date']
            if isinstance(end_date, str):
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            if not end_date.tzinfo:
                end_date = end_date.replace(tzinfo=ZoneInfo(event_timezone))
            update_data['end_date'] = end_date
        
        # Updated_at alanını güncelle
        update_data['updated_at'] = datetime.now(ZoneInfo(event_timezone))
        
        logger.info(f"Updating event {db_obj.id} with data: {update_data}")
        
        return super().update(db=db, db_obj=db_obj, obj_in=update_data)


event = CRUDEvent(Event)

__all__ = ["event"]
