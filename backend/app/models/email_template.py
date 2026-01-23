from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class EmailTemplate(Base, TimestampMixin):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    variables = Column(JSON, nullable=True)  # Template değişkenleri için
    is_active = Column(Boolean, default=True)
    
    # Foreign Keys
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    organization = relationship("Organization", back_populates="email_templates")
    logs = relationship("EmailLog", back_populates="template")

    def __repr__(self):
        return f"<EmailTemplate {self.name}>"
