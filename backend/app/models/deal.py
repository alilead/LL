from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, DateTime, Numeric, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
import enum

class DealStatus(str, enum.Enum):
    Lead = "Lead"
    Qualified = "Qualified"
    Proposal = "Proposal"
    Negotiation = "Negotiation"
    Closed_Won = "Closed Won"
    Closed_Lost = "Closed Lost"

    @classmethod
    def from_str(cls, value: str) -> "DealStatus":
        """Convert string to enum value"""
        try:
            # Handle special cases for Closed Won/Lost
            if value == "Closed_Won":
                return cls.Closed_Won
            if value == "Closed_Lost":
                return cls.Closed_Lost
            
            # Try direct match
            return cls(value)
        except ValueError:
            # Try title case as fallback
            try:
                return cls(value.title())
            except ValueError:
                raise ValueError(f"Invalid status value: {value}")

    def __str__(self) -> str:
        """Return display value"""
        return self.value

class Deal(Base, TimestampMixin):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=False)
    status = Column(Enum(DealStatus), nullable=False)
    valid_until = Column(Date, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    
    # Foreign Keys
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="deals")
    assigned_to = relationship("User", back_populates="deals")
    lead = relationship("Lead", back_populates="deals")
    currency = relationship("Currency", back_populates="deals")
    notes = relationship("Note", back_populates="deal")
    activities = relationship("Activity", back_populates="deal")
    opportunities = relationship("Opportunity", back_populates="deal")
    events = relationship("Event", back_populates="deal", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Deal {self.name}>"