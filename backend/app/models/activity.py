from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base, TimestampMixin
from datetime import datetime

class ActivityType(str, enum.Enum):
    EMAIL = "EMAIL"
    CALL = "CALL"
    MEETING = "MEETING"
    NOTE = "NOTE"
    STAGE_CHANGE = "STAGE_CHANGE"
    TASK_CREATED = "TASK_CREATED"
    TASK_COMPLETED = "TASK_COMPLETED"

class Activity(Base, TimestampMixin):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(SQLEnum(ActivityType))
    description = Column(Text, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    duration = Column(Integer, default=0)  # Duration in minutes
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)  # Artık nullable
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="activities")
    organization = relationship("Organization", back_populates="activities")
    lead = relationship("Lead", back_populates="activities")
    deal = relationship("Deal", back_populates="activities")

    def __repr__(self):
        return f"<Activity {self.type} - {self.description[:30]}>"
