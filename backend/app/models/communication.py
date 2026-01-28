from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Text, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime

class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(
        Enum("email", "sms", "call", "meeting", "video_call", "whatsapp", name="communication_type"),
        nullable=False
    )
    subject = Column(String(255), nullable=True)
    content = Column(Text, nullable=True)
    status = Column(
        Enum("scheduled", "in_progress", "completed", "cancelled", name="communication_status"),
        default="scheduled"
    )
    scheduled_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # Duration in minutes
    notes = Column(Text, nullable=True)

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="communications")
    organization = relationship("Organization", back_populates="communications")
    lead = relationship("Lead", back_populates="communications")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Communication {self.type} - {self.subject}>"
