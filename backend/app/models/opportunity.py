from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from datetime import datetime

class Opportunity(Base, TimestampMixin):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    value = Column(Float, nullable=True)
    probability = Column(Integer)
    expected_close_date = Column(DateTime, nullable=True)
    actual_close_date = Column(DateTime, nullable=True)
    status = Column(
        Enum("new", "qualified", "proposal", "negotiation", "won", "lost", name="opportunity_status"),
        default="new"
    )

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="opportunities")
    organization = relationship("Organization", back_populates="opportunities")
    lead = relationship("Lead", back_populates="opportunities")
    currency = relationship("Currency", back_populates="opportunities")
    deal = relationship("Deal", back_populates="opportunities")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
