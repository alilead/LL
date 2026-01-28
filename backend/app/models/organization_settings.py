from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Numeric
from sqlalchemy.orm import relationship

from app.models.base import Base

class OrganizationSettings(Base):
    __tablename__ = "organization_settings"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    timezone = Column(String(50), default="UTC")
    date_format = Column(String(20), default="YYYY-MM-DD")
    time_format = Column(String(20), default="HH:mm")
    currency_id = Column(Integer, ForeignKey("currencies.id"))
    logo_url = Column(String(512))
    theme_settings = Column(JSON)  # Store UI theme preferences
    email_settings = Column(JSON)  # Store email configuration
    notification_settings = Column(JSON)  # Store notification preferences
    default_lead_stage_id = Column(Integer, ForeignKey("lead_stages.id"))
    lead_auto_assignment = Column(Boolean, default=False)
    deal_approval_required = Column(Boolean, default=False)
    min_deal_amount = Column(Numeric(15, 2))
    max_deal_amount = Column(Numeric(15, 2))
    task_reminder_enabled = Column(Boolean, default=True)
    default_task_reminder_minutes = Column(Integer, default=30)
    email_signature = Column(String)
    default_email_template_id = Column(Integer, ForeignKey("email_templates.id"))
    analytics_enabled = Column(Boolean, default=True)
    custom_analytics_settings = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", lazy="joined")
    currency = relationship("Currency", lazy="joined")
    default_lead_stage = relationship("LeadStage", lazy="joined", foreign_keys=[default_lead_stage_id])
    default_email_template = relationship("EmailTemplate", lazy="joined")

    def __repr__(self):
        return f"<OrganizationSettings {self.organization_id}>"

    @property
    def theme(self) -> Dict[str, Any]:
        """Get theme settings with defaults"""
        default_theme = {
            "primaryColor": "#1890ff",
            "secondaryColor": "#52c41a",
            "layout": "side",
            "contentWidth": "fluid",
            "fixedHeader": True,
            "fixSiderbar": True,
            "colorWeak": False,
            "darkMode": False
        }
        if not self.theme_settings:
            return default_theme
        return {**default_theme, **self.theme_settings}

    @property
    def email_config(self) -> Dict[str, Any]:
        """Get email settings with defaults"""
        default_email = {
            "smtp_server": "",
            "smtp_port": 587,
            "smtp_use_tls": True,
            "sender_name": "",
            "sender_email": "",
            "footer_text": "",
            "signature": ""
        }
        if not self.email_settings:
            return default_email
        return {**default_email, **self.email_settings}

    @property
    def notification_config(self) -> Dict[str, Any]:
        """Get notification settings with defaults"""
        default_notifications = {
            "email": True,
            "push": True,
            "in_app": True,
            "slack": False,
            "webhook": None
        }
        if not self.notification_settings:
            return default_notifications
        return {**default_notifications, **self.notification_settings}
