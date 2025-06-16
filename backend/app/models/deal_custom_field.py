from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, JSON, TIMESTAMP
from sqlalchemy.sql import func
from app.db.base_class import Base

class DealCustomField(Base):
    __tablename__ = "deal_custom_fields"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    field_name = Column(String(100), nullable=False)
    field_type = Column(Enum("text", "number", "date", "select", name="field_type"), nullable=False)
    field_options = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

class DealCustomFieldValue(Base):
    __tablename__ = "deal_custom_field_values"

    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"))
    custom_field_id = Column(Integer, ForeignKey("deal_custom_fields.id", ondelete="CASCADE"))
    field_value = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
