# /backend/app/crud/crud_event_attendee.py
from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.event_attendee import EventAttendee
from app.schemas.event_attendee import EventAttendeeCreate, EventAttendeeUpdate

class CRUDEventAttendee(CRUDBase[EventAttendee, EventAttendeeCreate, EventAttendeeUpdate]):
    pass

event_attendee = CRUDEventAttendee(EventAttendee)