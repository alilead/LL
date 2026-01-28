from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Enum, Text
from sqlalchemy.orm import relationship

from app.models.base import Base


class CustomFieldDefinition(Base):
    __tablename__ = "custom_field_definitions"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    entity_type = Column(
        Enum('lead', 'deal', 'contact', 'task', 'organization', name='custom_field_entity_type'),
        nullable=False
    )
    field_type = Column(
        Enum(
            'text', 'number', 'date', 'select', 'multi_select', 
            'currency', 'file', 'url', 'email', 'phone',
            name='custom_field_type'
        ),
        nullable=False
    )
    name = Column(String(255), nullable=False)
    key = Column(String(255), nullable=False)  # Unique identifier for the field
    description = Column(Text)
    placeholder = Column(String(255))
    default_value = Column(JSON)
    options = Column(JSON)  # For select/multi-select fields
    validation_rules = Column(JSON)  # JSON schema for validation
    is_required = Column(Boolean, default=False)
    is_visible = Column(Boolean, default=True)
    is_filterable = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    group_name = Column(String(255))  # For grouping fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


    # Relationships
    organization = relationship("Organization", back_populates="custom_fields")
    values = relationship("CustomFieldValue", back_populates="field_definition")
    

    def __repr__(self):
        return f"<CustomFieldDefinition {self.name}>"

    @property
    def validation_schema(self) -> Dict[str, Any]:
        """Get JSON schema for field validation"""
        base_schema = {
            "type": self._get_json_schema_type(),
            "title": self.name,
            "description": self.description
        }

        if self.is_required:
            base_schema["required"] = True

        if self.validation_rules:
            base_schema.update(self.validation_rules)

        if self.field_type in ['select', 'multi_select'] and self.options:
            base_schema["enum"] = self.options

        return base_schema

    def _get_json_schema_type(self) -> str:
        """Map field type to JSON schema type"""
        type_mapping = {
            'text': 'string',
            'number': 'number',
            'date': 'string',
            'select': 'string',
            'multi_select': 'array',
            'currency': 'number',
            'file': 'string',
            'url': 'string',
            'email': 'string',
            'phone': 'string'
        }
        return type_mapping.get(self.field_type, 'string')


class CustomFieldValue(Base):
    __tablename__ = "custom_field_values"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    field_definition_id = Column(Integer, ForeignKey("custom_field_definitions.id"), nullable=False)
    entity_type = Column(
        Enum('lead', 'deal', 'contact', 'task', 'organization', name='custom_field_entity_type'),
        nullable=False
    )
    entity_id = Column(Integer, nullable=False)
    value = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="custom_field_values")
    field_definition = relationship("CustomFieldDefinition", back_populates="values")

    def __repr__(self):
        return f"<CustomFieldValue {self.field_definition_id}:{self.entity_id}>"

    @property
    def formatted_value(self) -> Any:
        """Format value based on field type"""
        if not self.value or not self.field_definition:
            return None

        if self.field_definition.field_type == 'date':
            return datetime.fromisoformat(self.value).strftime('%Y-%m-%d')
        elif self.field_definition.field_type == 'currency':
            return f"{self.value:.2f}"
        elif self.field_definition.field_type == 'multi_select':
            return self.value if isinstance(self.value, list) else [self.value]
        
        return self.value
