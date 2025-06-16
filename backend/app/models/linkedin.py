from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class LinkedInTemplate(Base):
    __tablename__ = "linkedin_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    variables = Column(JSON)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    created_at = Column(DateTime, default=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="linkedin_templates")

class LinkedInConnection(Base):
    __tablename__ = "linkedin_connections"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(50))
    connected_at = Column(DateTime)
    last_interaction = Column(DateTime)
    notes = Column(Text)

    # Relationships
    lead = relationship("Lead", back_populates="linkedin_connections")
    user = relationship("User", back_populates="linkedin_connections")

class LinkedInInteraction(Base):
    __tablename__ = "linkedin_interactions"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String(50))
    content = Column(Text)
    status = Column(String(50))
    created_at = Column(DateTime, default=func.now())

    # Relationships
    lead = relationship("Lead", back_populates="linkedin_interactions")
    user = relationship("User", back_populates="linkedin_interactions") 