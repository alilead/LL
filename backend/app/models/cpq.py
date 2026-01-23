"""
CPQ (Configure-Price-Quote) Models

Product catalog, pricing rules, and quote generation.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, JSON, Float, Numeric
from sqlalchemy.orm import relationship
from app.models.base import Base


class Product(Base):
    """Product in catalog"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    sku = Column(String(100), unique=True)

    organization_id = Column(Integer, ForeignKey("organizations.id"))

    # Pricing
    base_price = Column(Numeric(10, 2))
    currency = Column(String(3), default="USD")

    is_active = Column(Boolean, default=True)
    category = Column(String(100))

    created_at = Column(DateTime, default=datetime.utcnow)

    quote_items = relationship("QuoteItem", back_populates="product")


class Quote(Base):
    """Sales quote"""
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True)
    quote_number = Column(String(100), unique=True)

    organization_id = Column(Integer, ForeignKey("organizations.id"))
    deal_id = Column(Integer, ForeignKey("deals.id"))
    created_by_id = Column(Integer, ForeignKey("users.id"))

    # Amounts
    subtotal = Column(Numeric(10, 2))
    discount_amount = Column(Numeric(10, 2), default=0)
    tax_amount = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(10, 2))

    currency = Column(String(3), default="USD")

    # Status
    status = Column(String(50), default="draft")  # draft, sent, accepted, rejected
    valid_until = Column(DateTime)

    # Approval
    requires_approval = Column(Boolean, default=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime)
    accepted_at = Column(DateTime)

    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan")


class QuoteItem(Base):
    """Line item in a quote"""
    __tablename__ = "quote_items"

    id = Column(Integer, primary_key=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"))
    product_id = Column(Integer, ForeignKey("products.id"))

    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(10, 2))
    discount_percent = Column(Numeric(5, 2), default=0)
    line_total = Column(Numeric(10, 2))

    description = Column(Text)

    quote = relationship("Quote", back_populates="items")
    product = relationship("Product", back_populates="quote_items")


class PricingRule(Base):
    """Pricing rule for discounts"""
    __tablename__ = "pricing_rules"

    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    organization_id = Column(Integer, ForeignKey("organizations.id"))

    # Conditions
    conditions = Column(JSON)  # {min_quantity, product_ids, customer_tier}

    # Discount
    discount_type = Column(String(20))  # percentage, fixed
    discount_value = Column(Numeric(10, 2))

    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
