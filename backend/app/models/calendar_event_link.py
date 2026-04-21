from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base


class CalendarEventLink(Base):
    __tablename__ = "calendar_event_links"

    id = Column(Integer, primary_key=True, index=True)
    integration_id = Column(Integer, ForeignKey("calendar_integrations.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    external_event_id = Column(String(255), nullable=False, index=True)
    external_calendar_id = Column(String(255), nullable=True, default="primary")
    external_etag = Column(String(255), nullable=True)
    last_external_updated_at = Column(DateTime, nullable=True)
    last_internal_updated_at = Column(DateTime, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    integration = relationship("CalendarIntegration")
    event = relationship("Event")
    organization = relationship("Organization")
    user = relationship("User")

    def __repr__(self) -> str:
        return f"<CalendarEventLink integration={self.integration_id} event={self.event_id} external={self.external_event_id}>"
