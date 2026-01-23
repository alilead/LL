from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Note(Base, TimestampMixin):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    
    # Foreign Keys
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    deal_id = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="notes")
    created_by = relationship("User", back_populates="notes")
    lead = relationship("Lead", back_populates="notes")
    deal = relationship("Deal", back_populates="notes")
