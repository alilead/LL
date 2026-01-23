from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from datetime import datetime

class LeadStage(Base, TimestampMixin):
    __tablename__ = "lead_stages"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)
    order_index = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)  # Column doesn't exist in database

    # Relationships
    organization = relationship("Organization", back_populates="lead_stages")
    leads = relationship("Lead", back_populates="stage")

    @property
    def order(self):
        return self.order_index

    @order.setter
    def order(self, value):
        self.order_index = value

    def __repr__(self):
        return f"<LeadStage {self.name}>"