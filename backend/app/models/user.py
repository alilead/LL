from datetime import datetime
from sqlalchemy import Boolean, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base
from app.models.associations import user_roles
from typing import Optional, List, Union, TYPE_CHECKING
import enum

class OrganizationRole(enum.Enum):
    VIEWER = "VIEWER"
    MEMBER = "MEMBER"
    MANAGER = "MANAGER"

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.role import Role
    from app.models.lead import Lead
    from app.models.task import Task
    from app.models.note import Note
    from app.models.event import Event
    from app.models.deal import Deal
    from app.models.email_log import EmailLog
    from app.models.file import File
    from app.models.communication import Communication
    from app.models.opportunity import Opportunity
    from app.models.activity import Activity
    from app.models.event_attendee import EventAttendee
    from app.models.api_token import APIToken
    # from app.models.report import Report
    from app.models.notification import Notification
    from app.models.message import Message
    from app.models.linkedin_connection import LinkedInConnection

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)  # Unified password field
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean(), default=True, nullable=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean(), default=False, nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean(), default=False, nullable=True)  # Global admin (LeadLab only)
    organization_role: Mapped[OrganizationRole] = mapped_column(Enum(OrganizationRole), default=OrganizationRole.MEMBER, nullable=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # LinkedIn Integration
    linkedin_token: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    linkedin_refresh_token: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    linkedin_token_expires: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, default=None)
    linkedin_profile_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default=None)
    linkedin_profile_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")
    roles: Mapped[List["Role"]] = relationship("Role", secondary=user_roles, back_populates="users")
    leads: Mapped[List["Lead"]] = relationship("Lead", back_populates="user", foreign_keys="[Lead.user_id]")
    created_leads: Mapped[List["Lead"]] = relationship("Lead", back_populates="creator", foreign_keys="[Lead.created_by]")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="assigned_to", foreign_keys="Task.assigned_to_id")
    notes: Mapped[List["Note"]] = relationship("Note", back_populates="created_by")
    created_events: Mapped[List["Event"]] = relationship("Event", back_populates="creator", foreign_keys="[Event.created_by]")
    deals: Mapped[List["Deal"]] = relationship("Deal", back_populates="assigned_to")
    email_logs: Mapped[List["EmailLog"]] = relationship("EmailLog", back_populates="user")
    email_accounts: Mapped[List["EmailAccount"]] = relationship("EmailAccount", back_populates="user")
    files: Mapped[List["File"]] = relationship("File", back_populates="user")
    communications: Mapped[List["Communication"]] = relationship("Communication", back_populates="user")
    opportunities: Mapped[List["Opportunity"]] = relationship("Opportunity", back_populates="user")
    activities: Mapped[List["Activity"]] = relationship("Activity", back_populates="user")
    event_attendees: Mapped[List["EventAttendee"]] = relationship(
        "EventAttendee",
        back_populates="user",
        overlaps="attended_events,attendees"
    )
    api_tokens: Mapped[List["APIToken"]] = relationship("APIToken", back_populates="user")
    attended_events: Mapped[List["Event"]] = relationship(
        "Event",
        secondary="event_attendees",
        back_populates="attendees",
        overlaps="event_attendees"
    )
    # reports: Mapped[List["Report"]] = relationship("Report", back_populates="user")
    # notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")
    sent_messages: Mapped[List["Message"]] = relationship("Message", foreign_keys="[Message.sender_id]", back_populates="sender")
    received_messages: Mapped[List["Message"]] = relationship("Message", foreign_keys="[Message.receiver_id]", back_populates="receiver")
    linkedin_connection: Mapped[Optional["LinkedInConnection"]] = relationship("LinkedInConnection", back_populates="user", uselist=False)

    @property
    def hashed_password(self) -> str:
        """Compatibility property for auth system"""
        return str(self.password_hash)

    @hashed_password.setter
    def hashed_password(self, value: str) -> None:
        """Compatibility setter for auth system"""
        self.password_hash = value

    @property
    def full_name(self) -> str:
        """Get full name of the user."""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_linkedin_connected(self) -> bool:
        """LinkedIn bağlantı durumunu kontrol et"""
        return bool(
            self.linkedin_token and 
            self.linkedin_token_expires and 
            self.linkedin_token_expires > datetime.utcnow()
        )

    @property
    def is_organization_manager(self) -> bool:
        """Check if user is organization manager"""
        return self.organization_role == OrganizationRole.MANAGER
    
    @property
    def can_manage_organization(self) -> bool:
        """Check if user can manage organization (admin or manager)"""
        return self.is_admin or self.is_organization_manager
    
    @property
    def display_role(self) -> str:
        """Get display role for UI"""
        if self.is_admin:
            return "Administrator"
        elif self.is_organization_manager:
            return "Organization Manager"
        else:
            return self.organization_role.value.lower().title()

    def __repr__(self) -> str:
        return f"<User {self.email}>"