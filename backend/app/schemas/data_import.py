"""
Data Import/Export Schemas
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# Field Mapping Schemas
class FieldMappingCreate(BaseModel):
    """Create field mapping"""
    source_field: str
    target_field: str
    transform_function: Optional[str] = None
    default_value: Optional[str] = None
    is_required: bool = False
    validation_rule: Optional[str] = None


class FieldMappingResponse(FieldMappingCreate):
    """Field mapping response"""
    id: int
    import_job_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Import Job Schemas
class ImportJobCreate(BaseModel):
    """Create import job"""
    source_type: str  # csv, salesforce, hubspot, pipedrive
    source_name: Optional[str] = None
    entity_type: str  # leads, contacts, deals, accounts
    field_mapping: Optional[Dict[str, str]] = None
    deduplicate: bool = True
    update_existing: bool = False
    options: Optional[Dict[str, Any]] = None


class ImportJobUpdate(BaseModel):
    """Update import job"""
    status: Optional[str] = None
    field_mapping: Optional[Dict[str, str]] = None
    options: Optional[Dict[str, Any]] = None


class ImportJobResponse(BaseModel):
    """Import job response"""
    id: int
    organization_id: int
    created_by_id: Optional[int] = None
    source_type: str
    source_name: Optional[str] = None
    entity_type: str
    file_path: Optional[str] = None
    status: str
    field_mapping: Optional[Dict[str, str]] = None
    total_records: int
    processed_records: int
    successful_records: int
    failed_records: int
    skipped_records: int
    error_log: Optional[List[Dict[str, Any]]] = None
    import_summary: Optional[Dict[str, Any]] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    deduplicate: bool
    update_existing: bool

    model_config = ConfigDict(from_attributes=True)


class ImportProgress(BaseModel):
    """Import progress status"""
    job_id: int
    status: str
    total_records: int
    processed_records: int
    successful_records: int
    failed_records: int
    skipped_records: int
    progress_percentage: float
    estimated_time_remaining: Optional[int] = None  # seconds


# CSV Import Schemas
class CSVImportRequest(BaseModel):
    """CSV import request"""
    entity_type: str = Field(..., description="leads, contacts, deals, accounts")
    file_name: str
    has_header: bool = True
    delimiter: str = ","
    encoding: str = "utf-8"
    deduplicate: bool = True
    update_existing: bool = False


class CSVPreviewResponse(BaseModel):
    """CSV preview response"""
    headers: List[str]
    sample_rows: List[List[str]]
    total_rows: int
    detected_fields: Dict[str, str]  # Suggested field mappings


# CRM Connection Schemas
class CRMConnectionCreate(BaseModel):
    """Create CRM connection"""
    crm_type: str  # salesforce, hubspot, pipedrive
    connection_name: str
    credentials: Dict[str, Any]
    api_endpoint: Optional[str] = None
    sync_settings: Optional[Dict[str, Any]] = None


class CRMConnectionUpdate(BaseModel):
    """Update CRM connection"""
    connection_name: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    sync_settings: Optional[Dict[str, Any]] = None


class CRMConnectionResponse(BaseModel):
    """CRM connection response"""
    id: int
    organization_id: int
    crm_type: str
    connection_name: str
    is_active: bool
    last_sync_at: Optional[datetime] = None
    sync_status: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# CRM Import Schemas
class SalesforceImportRequest(BaseModel):
    """Salesforce import request"""
    connection_id: int
    entity_type: str  # Lead, Contact, Account, Opportunity
    soql_query: Optional[str] = None
    import_all: bool = False
    field_mapping: Optional[Dict[str, str]] = None


class HubSpotImportRequest(BaseModel):
    """HubSpot import request"""
    connection_id: int
    entity_type: str  # contacts, companies, deals
    list_id: Optional[int] = None
    import_all: bool = False
    field_mapping: Optional[Dict[str, str]] = None


class PipedriveImportRequest(BaseModel):
    """Pipedrive import request"""
    connection_id: int
    entity_type: str  # persons, organizations, deals
    filter_id: Optional[int] = None
    import_all: bool = False
    field_mapping: Optional[Dict[str, str]] = None


# Export Schemas
class ExportJobCreate(BaseModel):
    """Create export job"""
    entity_type: str
    format: str = "csv"  # csv, json, xlsx
    filters: Optional[Dict[str, Any]] = None


class ExportJobResponse(BaseModel):
    """Export job response"""
    id: int
    organization_id: int
    entity_type: str
    format: str
    status: str
    file_url: Optional[str] = None
    total_records: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Import Record Schemas
class ImportRecordResponse(BaseModel):
    """Import record response"""
    id: int
    import_job_id: int
    source_record_id: Optional[str] = None
    target_record_id: Optional[int] = None
    status: str
    error_message: Optional[str] = None
    source_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Validation Schemas
class ImportValidationResult(BaseModel):
    """Import validation result"""
    is_valid: bool
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []
    total_records: int
    valid_records: int
    invalid_records: int


# Field Mapping Template Schemas
class FieldMappingTemplate(BaseModel):
    """Pre-configured field mapping template"""
    name: str
    source_crm: str  # salesforce, hubspot, pipedrive
    target_entity: str  # leads, contacts, deals
    mappings: Dict[str, str]
    description: Optional[str] = None


# Deduplication Schemas
class DeduplicationRule(BaseModel):
    """Deduplication rule"""
    match_fields: List[str]  # Fields to match on (e.g., ["email"])
    strategy: str = "skip"  # skip, update, create_new


class DeduplicationResult(BaseModel):
    """Deduplication result"""
    total_checked: int
    duplicates_found: int
    duplicates_skipped: int
    duplicates_updated: int
    duplicate_details: List[Dict[str, Any]] = []
