"""
Data Import/Export Models

Models for importing data from competitors (Salesforce, HubSpot, Pipedrive) and CSV files.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
import enum


class ImportStatus(enum.Enum):
    """Import job status"""
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class ImportSource(enum.Enum):
    """Data source type"""
    csv = "csv"
    salesforce = "salesforce"
    hubspot = "hubspot"
    pipedrive = "pipedrive"
    zoho = "zoho"
    microsoft_dynamics = "microsoft_dynamics"
    api = "api"


class ImportJob(Base):
    """Import job tracking"""
    __tablename__ = "import_jobs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, nullable=False, index=True)
    created_by_id = Column(Integer, nullable=True)

    # Source information
    source_type = Column(SQLEnum(ImportSource), nullable=False)
    source_name = Column(String(255), nullable=True)  # e.g., "Salesforce Production"

    # Import details
    entity_type = Column(String(50), nullable=False)  # leads, contacts, deals, accounts
    file_path = Column(String(500), nullable=True)  # For CSV imports

    # Status tracking
    status = Column(SQLEnum(ImportStatus), default=ImportStatus.pending, index=True)

    # Field mapping (JSON)
    field_mapping = Column(JSON, nullable=True)  # {"external_field": "internal_field"}

    # Statistics
    total_records = Column(Integer, default=0)
    processed_records = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    skipped_records = Column(Integer, default=0)

    # Results
    error_log = Column(JSON, nullable=True)  # List of errors
    import_summary = Column(JSON, nullable=True)  # Summary statistics

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Settings
    options = Column(JSON, nullable=True)  # Additional import options
    deduplicate = Column(Boolean, default=True)
    update_existing = Column(Boolean, default=False)

    # Relationships
    mappings = relationship("FieldMapping", back_populates="import_job", cascade="all, delete-orphan")
    records = relationship("ImportRecord", back_populates="import_job", cascade="all, delete-orphan")


class FieldMapping(Base):
    """Field mapping configuration"""
    __tablename__ = "field_mappings"

    id = Column(Integer, primary_key=True, index=True)
    import_job_id = Column(Integer, nullable=False, index=True)

    # Mapping details
    source_field = Column(String(255), nullable=False)  # External field name
    target_field = Column(String(255), nullable=False)  # Internal field name

    # Transformation
    transform_function = Column(String(100), nullable=True)  # e.g., "uppercase", "trim", "format_phone"
    default_value = Column(String(255), nullable=True)  # Default if empty
    is_required = Column(Boolean, default=False)

    # Validation
    validation_rule = Column(String(255), nullable=True)  # e.g., "email", "phone", "url"

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    import_job = relationship("ImportJob", back_populates="mappings")


class ImportRecord(Base):
    """Individual import record tracking"""
    __tablename__ = "import_records"

    id = Column(Integer, primary_key=True, index=True)
    import_job_id = Column(Integer, nullable=False, index=True)

    # Record details
    source_record_id = Column(String(255), nullable=True)  # ID from source system
    target_record_id = Column(Integer, nullable=True)  # Created record ID in our system

    # Status
    status = Column(String(50), default="pending")  # pending, success, failed, skipped
    error_message = Column(Text, nullable=True)

    # Original data
    source_data = Column(JSON, nullable=True)  # Original record data

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    import_job = relationship("ImportJob", back_populates="records")


class ExportJob(Base):
    """Export job tracking"""
    __tablename__ = "export_jobs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, nullable=False, index=True)
    created_by_id = Column(Integer, nullable=True)

    # Export details
    entity_type = Column(String(50), nullable=False)  # leads, contacts, deals, accounts
    format = Column(String(20), default="csv")  # csv, json, xlsx

    # Filters (JSON)
    filters = Column(JSON, nullable=True)  # Export filters

    # Status
    status = Column(String(50), default="pending")
    file_path = Column(String(500), nullable=True)  # Generated file path
    file_url = Column(String(500), nullable=True)  # Download URL

    # Statistics
    total_records = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Download link expiration


class CRMConnection(Base):
    """CRM integration connection"""
    __tablename__ = "crm_connections"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, nullable=False, index=True)
    created_by_id = Column(Integer, nullable=True)

    # Connection details
    crm_type = Column(SQLEnum(ImportSource), nullable=False)
    connection_name = Column(String(255), nullable=False)

    # Authentication (encrypted)
    credentials = Column(JSON, nullable=True)  # Encrypted credentials
    api_endpoint = Column(String(500), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    sync_status = Column(String(50), nullable=True)

    # Settings
    sync_settings = Column(JSON, nullable=True)  # Auto-sync configuration

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
