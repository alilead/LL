# app/models/email.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from datetime import datetime

class EmailTemplate(Base, TimestampMixin):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)  # Changed from body to content to match your existing code
    is_active = Column(Boolean, default=True)
    
    # Foreign Keys
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    organization = relationship("Organization", back_populates="email_templates")
    email_logs = relationship("EmailLog", back_populates="template")

    def render(self, context: dict) -> str:
        from jinja2 import Template
        template = Template(self.content)
        return template.render(**context)