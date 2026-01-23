from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class Currency(Base):
    __tablename__ = "currencies"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(3), nullable=False, unique=True)
    name = Column(String(50), nullable=False)
    symbol = Column(String(5))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    deals = relationship("Deal", back_populates="currency")
    opportunities = relationship("Opportunity", back_populates="currency")
