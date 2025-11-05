from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.models.base import Base
import enum

class TransactionType(str, enum.Enum):
    """Enum for transaction types"""
    PURCHASE = "purchase"
    REFUND = "refund"
    USAGE = "usage"
    BONUS = "bonus"
    EXPIRY = "expiry"
    TRANSFER = "transfer"

class DataType(str, enum.Enum):
    """Enum for data types in transactions"""
    PSYCHOMETRIC_DATA = "psychometric_data"
    CONTACT_INFO = "contact_info"
    LEAD_SCORE = "lead_score"
    TOKEN_PURCHASE = "token_purchase"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    type = Column(String(50))  # purchase, refund
    amount = Column(Numeric(10, 2))
    data_type = Column(String(50), nullable=True)  # psychometric_data, contact_info, etc.
    description = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
