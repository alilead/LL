from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
import enum

class EmailProviderType(str, enum.Enum):
    GMAIL = "gmail"
    OUTLOOK = "outlook"
    YAHOO = "yahoo"
    CUSTOM = "custom"

class EmailSyncStatus(str, enum.Enum):
    ACTIVE = "active"
    ERROR = "error"
    DISABLED = "disabled"
    SYNCING = "syncing"

class EmailAccount(Base, TimestampMixin):
    __tablename__ = "email_accounts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    display_name = Column(String(255), nullable=True)
    provider_type = Column(String(50), nullable=False)
    
    # IMAP Settings
    imap_host = Column(String(255), nullable=False)
    imap_port = Column(Integer, nullable=False, default=993)
    imap_use_ssl = Column(Boolean, default=True)
    
    # SMTP Settings  
    smtp_host = Column(String(255), nullable=False)
    smtp_port = Column(Integer, nullable=False, default=587)
    smtp_use_tls = Column(Boolean, default=True)
    
    # Auth (encrypted)
    password_encrypted = Column(Text, nullable=False)  # Will encrypt this
    
    # Sync Settings
    sync_status = Column(String(50), default=EmailSyncStatus.ACTIVE.value)
    last_sync_at = Column(DateTime, nullable=True)
    sync_error_message = Column(Text, nullable=True)
    sync_enabled = Column(Boolean, default=True)
    sync_frequency_minutes = Column(Integer, default=15)  # Sync every 15 minutes
    
    # Sync Options
    sync_sent_items = Column(Boolean, default=True)
    sync_inbox = Column(Boolean, default=True)
    days_to_sync = Column(Integer, default=30)  # Sync last 30 days
    
    # Additional settings
    signature = Column(Text, nullable=True)
    auto_create_contacts = Column(Boolean, default=True)
    auto_create_tasks = Column(Boolean, default=True)
    
    # Calendar Sync Settings
    calendar_sync_enabled = Column(Boolean, default=True)
    calendar_url = Column(String(500), nullable=True)  # CalDAV URL for custom providers
    calendar_sync_token = Column(Text, nullable=True)  # OAuth token for Google/Outlook
    last_calendar_sync_at = Column(DateTime, nullable=True)
    calendar_sync_error = Column(Text, nullable=True)
    auto_sync_calendar_events = Column(Boolean, default=True)
    
    # Foreign Keys
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    organization = relationship("Organization", back_populates="email_accounts")
    user = relationship("User", back_populates="email_accounts")
    emails = relationship("Email", back_populates="email_account", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<EmailAccount {self.email}>" 