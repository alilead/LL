from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.associations import lead_tags

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="tags")
    leads = relationship("Lead", secondary=lead_tags, back_populates="tags")

    def __repr__(self) -> str:
        return f"<Tag {self.name}>"
