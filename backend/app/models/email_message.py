# app/models/email_message.py
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from datetime import datetime


class EmailDirection(str, Enum):
    incoming = "incoming"
    outgoing = "outgoing"


class EmailStatus(str, Enum):
    unread = "unread"
    read = "read"
    replied = "replied"
    forwarded = "forwarded"
    archived = "archived"


class Email(Base, TimestampMixin):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String(255), unique=True, nullable=False, index=True)
    thread_id = Column(String(255), nullable=True, index=True)
    
    # Email metadata
    subject = Column(String(500), nullable=False)
    from_email = Column(String(255), nullable=False)
    from_name = Column(String(255), nullable=True)
    to_emails = Column(Text, nullable=False)  # JSON array of recipients (matches DB)
    cc_emails = Column(Text, nullable=True)   # JSON array of CC recipients (matches DB)
    bcc_emails = Column(Text, nullable=True)  # JSON array of BCC recipients (matches DB)
    reply_to = Column(String(255), nullable=True)
    
    # Content
    body_text = Column(Text, nullable=True)
    body_html = Column(Text, nullable=True)
    
    # Status and direction
    direction = Column(SQLEnum(EmailDirection), nullable=False)
    status = Column(SQLEnum(EmailStatus), nullable=False, default=EmailStatus.unread)
    priority = Column(String(20), default='normal')
    
    # Timestamps
    sent_date = Column(DateTime, nullable=False)  # Matches DB column name
    received_date = Column(DateTime, nullable=True)  # Matches DB column name
    
    # Flags
    is_important = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)  # Matches DB column name
    has_attachments = Column(Boolean, default=False)
    
    # Email specific fields
    folder_name = Column(String(255), nullable=True)
    imap_uid = Column(String(50), nullable=True)
    contains_meeting_info = Column(Boolean, default=False)
    extracted_dates = Column(Text, nullable=True)  # JSON
    action_items = Column(Text, nullable=True)  # JSON
    sentiment_score = Column(String(20), nullable=True)
    
    # Foreign Keys - matching DB schema
    email_account_id = Column(Integer, ForeignKey("email_accounts.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    deal_id = Column(Integer, ForeignKey("deals.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    email_account = relationship("EmailAccount", back_populates="emails")
    organization = relationship("Organization", back_populates="emails")
    lead = relationship("Lead", back_populates="emails", foreign_keys=[lead_id])
    deal = relationship("Deal", back_populates="emails", foreign_keys=[deal_id])
    attachments = relationship("EmailAttachment", back_populates="email", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Email(id={self.id}, subject='{self.subject}', from='{self.from_email}')>"
