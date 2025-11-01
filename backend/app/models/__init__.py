# Import base classes first
from .base import Base, TimestampMixin

# Import association tables
from .associations import user_roles, role_permissions, lead_tags

# Import models in dependency order
from .organization import Organization
from .role import Role
from .permission import Permission
from .user import User
from .email import EmailTemplate
from .email_log import EmailLog
from .email_message import Email, EmailDirection, EmailStatus
from .email_attachment import EmailAttachment
from .email_account import EmailAccount
from .activity import Activity
from .lead_stage import LeadStage
from .currency import Currency
from .task import Task
from .deal import Deal
from .event import Event
from .event_attendee import EventAttendee
from .note import Note
from .api_token import APIToken, APITokenUsage
from .email import EmailTemplate
from .file import File
from .organization import Organization
from .custom_field import CustomFieldDefinition, CustomFieldValue
from .tag import Tag
from .lead import Lead
from .organization_settings import OrganizationSettings
from .communication import Communication
from .opportunity import Opportunity
from .message import Message
from .information_request import InformationRequest
from .token import Token
from .transaction import Transaction, TransactionType, DataType
from .team_invitation import TeamInvitation
from .ai_insights import AIInsight
from .linkedin_connection import LinkedInConnection

# Export all models
__all__ = [
    # Base classes
    "Base",
    "TimestampMixin",
    
    # Core models
    "Organization",
    "User",
    "Role",
    "Permission",
    
    # Feature models
    "Activity",
    "LeadStage",
    "Currency",
    "Lead",
    "Task",
    "Deal",
    "Event",
    "EventAttendee",
    "Note",
    "APIToken",
    "APITokenUsage",
    "EmailTemplate",
    "EmailLog",
    "Email",
    "EmailDirection",
    "EmailStatus",
    "EmailAttachment",
    "EmailAccount",
    "File",
    "CustomFieldDefinition",
    "CustomFieldValue",
    "Tag",
    "OrganizationSettings",
    "Communication",
    "Opportunity",
    "Message",
    "InformationRequest",
    "Token",
    "Transaction",
    "TransactionType",
    "DataType",
    "TeamInvitation",
    "AIInsight",
    "LinkedInConnection",
    
    # Association tables
    "user_roles",
    "role_permissions",
    "lead_tags"
]

