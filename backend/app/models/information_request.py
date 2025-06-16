from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime

class InformationRequest(Base):
    __tablename__ = "information_requests"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    requested_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(100), nullable=False)
    status = Column(
        Enum("pending", "in_progress", "completed", "rejected", name="request_status"),
        nullable=False,
        default="pending"
    )
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime)

    # Add unique constraint for lead_id and field_name combination
    __table_args__ = (
        UniqueConstraint('lead_id', 'field_name', name='uix_lead_field'),
    )

    # Relationships
    lead = relationship("Lead", back_populates="information_requests")
    
    # Add this relationship at the end after all models are loaded
    @property
    def requester(self):
        from app.models.user import User
        from sqlalchemy.orm import Session
        session = Session.object_session(self)
        if session:
            return session.query(User).filter(User.id == self.requested_by).first()
        return None

    def __repr__(self):
        return f"<InformationRequest(id={self.id}, lead_id={self.lead_id}, field={self.field_name})>"
