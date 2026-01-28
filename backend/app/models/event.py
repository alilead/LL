from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship, Mapped
from app.models.base import Base

class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    title: Mapped[str] = Column(String(255), nullable=False)
    description: Mapped[Optional[str]] = Column(Text, nullable=True)
    start_date: Mapped[datetime] = Column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = Column(DateTime(timezone=True), nullable=False)
    location: Mapped[Optional[str]] = Column(String(255), nullable=True)
    event_type: Mapped[str] = Column(
        Enum("meeting", "video_call", "task", "reminder", name="event_type"),
        nullable=False,
        default="meeting"
    )
    status: Mapped[str] = Column(
        Enum("scheduled", "in_progress", "completed", "cancelled", name="event_status"),
        nullable=False,
        default="scheduled"
    )
    organization_id: Mapped[int] = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    created_by: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), nullable=False)
    is_all_day: Mapped[bool] = Column(Boolean, default=False, nullable=False)
    timezone: Mapped[str] = Column(String(50), nullable=False, default='UTC')
    lead_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("leads.id"), nullable=True)
    deal_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("deals.id"), nullable=True)
    source_email_id: Mapped[Optional[int]] = Column(Integer, nullable=True)
    email_account_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("email_accounts.id"), nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="events")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_events")
    lead = relationship("Lead", back_populates="events")
    deal = relationship("Deal", back_populates="events")
    # email_account = relationship("EmailAccount", back_populates="synced_events")
    attendees = relationship(
        "User",
        secondary="event_attendees",
        back_populates="attended_events",
        overlaps="event_attendees"
    )
    event_attendees = relationship(
        "EventAttendee",
        back_populates="event",
        cascade="all, delete-orphan",
        overlaps="attendees"
    )

    def __repr__(self):
        return f"<Event {self.title}>"

    def to_dict(self):
        """Convert event to dictionary with timezone-aware dates"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "location": self.location,
            "event_type": self.event_type,
            "status": self.status,
            "organization_id": self.organization_id,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_all_day": self.is_all_day,
            "lead_id": self.lead_id,
            "deal_id": self.deal_id,
            "email_account_id": self.email_account_id,
            "timezone": self.timezone
        }


class EventAttendee(Base):
    __tablename__ = "event_attendees"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    event_id: Mapped[int] = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = Column(
        Enum("pending", "accepted", "declined", name="attendee_status"),
        nullable=False,
        default="pending"
    )
    created_at: Mapped[datetime] = Column(DateTime, nullable=False)
    updated_at: Mapped[Optional[datetime]] = Column(DateTime, nullable=True)

    # Relationships
    event = relationship(
        "Event",
        back_populates="event_attendees",
        overlaps="attendees"
    )
    user = relationship(
        "User",
        back_populates="event_attendees",
        overlaps="attended_events,attendees"
    )
