from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from enum import Enum
from pydantic import BaseModel, Field, validator, constr


class CustomFieldEntityType(str, Enum):
    lead = "lead"
    deal = "deal"
    contact = "contact"
    task = "task"
    organization = "organization"


class CustomFieldType(str, Enum):
    text = "text"
    number = "number"
    date = "date"
    select = "select"
    multi_select = "multi_select"
    currency = "currency"
    file = "file"
    url = "url"
    email = "email"
    phone = "phone"


class ValidationRule(BaseModel):
    type: str
    value: Any
    message: str


class CustomFieldDefinitionBase(BaseModel):
    entity_type: CustomFieldEntityType
    field_type: CustomFieldType
    name: constr(min_length=1, max_length=255)
    key: constr(min_length=1, max_length=255)
    description: Optional[str] = None
    placeholder: Optional[str] = None
    default_value: Optional[Any] = None
    options: Optional[List[str]] = None
    validation_rules: Optional[Dict[str, Any]] = None
    is_required: bool = False
    is_visible: bool = True
    is_filterable: bool = True
    order: int = 0
    group_name: Optional[str] = None

    @validator('key')
    def validate_key(cls, v):
        if not v.isalnum() and not '_' in v:
            raise ValueError('Key must be alphanumeric with optional underscores')
        return v.lower()

    @validator('options')
    def validate_options(cls, v, values):
        if 'field_type' in values and values['field_type'] in ['select', 'multi_select']:
            if not v or len(v) < 1:
                raise ValueError('Options are required for select/multi-select fields')
        return v

    @validator('validation_rules')
    def validate_rules(cls, v, values):
        if not v:
            return v

        allowed_rules = {
            'text': ['min_length', 'max_length', 'pattern'],
            'number': ['minimum', 'maximum', 'multiple_of'],
            'date': ['minimum', 'maximum'],
            'currency': ['minimum', 'maximum'],
            'email': ['pattern'],
            'url': ['pattern'],
            'phone': ['pattern']
        }

        field_type = values.get('field_type')
        if field_type in allowed_rules:
            for rule in v:
                if rule not in allowed_rules[field_type]:
                    raise ValueError(
                        f'Rule {rule} not allowed for field type {field_type}'
                    )
        return v


class CustomFieldDefinitionCreate(CustomFieldDefinitionBase):
    organization_id: int


class CustomFieldDefinitionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    placeholder: Optional[str] = None
    default_value: Optional[Any] = None
    options: Optional[List[str]] = None
    validation_rules: Optional[Dict[str, Any]] = None
    is_required: Optional[bool] = None
    is_visible: Optional[bool] = None
    is_filterable: Optional[bool] = None
    order: Optional[int] = None
    group_name: Optional[str] = None


class CustomFieldDefinition(CustomFieldDefinitionBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime
    validation_schema: Dict[str, Any]

    class Config:
        from_attributes = True


class CustomFieldValueBase(BaseModel):
    field_definition_id: int
    entity_type: CustomFieldEntityType
    entity_id: int
    value: Any


class CustomFieldValueCreate(CustomFieldValueBase):
    organization_id: int


class CustomFieldValueUpdate(BaseModel):
    value: Any


class CustomFieldValue(CustomFieldValueBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime
    formatted_value: Any

    class Config:
        from_attributes = True


class CustomFieldDefinitionList(BaseModel):
    fields: List[CustomFieldDefinition]
    total: int
    page: int
    size: int
    has_more: bool


class CustomFieldValueList(BaseModel):
    values: List[CustomFieldValue]
    total: int
    page: int
    size: int
    has_more: bool


# API Response Models
class CustomFieldDefinitionResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[CustomFieldDefinition] = None


class CustomFieldDefinitionListResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: CustomFieldDefinitionList


class CustomFieldValueResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[CustomFieldValue] = None


class CustomFieldValueListResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: CustomFieldValueList


# Bulk Operations
class BulkCustomFieldValues(BaseModel):
    entity_type: CustomFieldEntityType
    entity_id: int
    values: Dict[str, Any]  # field_key: value


class BulkCustomFieldValuesResponse(BaseModel):
    success: bool = True
    message: str = "Operation successful"
    data: Dict[str, Any]  # field_key: formatted_value
