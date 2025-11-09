"""
CPQ (Configure-Price-Quote) Schemas

Pydantic schemas for product catalog, pricing, and quote generation.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, field_validator


# Product Schemas
class ProductBase(BaseModel):
    """Base product schema"""
    name: str = Field(..., description="Product name", max_length=255)
    description: Optional[str] = Field(None, description="Product description")
    sku: str = Field(..., description="Stock keeping unit", max_length=100)
    base_price: Decimal = Field(..., description="Base price", ge=0)
    currency: str = Field("USD", description="Currency code", max_length=3)
    is_active: bool = Field(True, description="Is product active?")
    category: Optional[str] = Field(None, description="Product category", max_length=100)


class ProductCreate(ProductBase):
    """Create product"""
    pass


class ProductUpdate(BaseModel):
    """Update product"""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=100)
    base_price: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    is_active: Optional[bool] = None
    category: Optional[str] = Field(None, max_length=100)


class ProductResponse(ProductBase):
    """Product response"""
    id: int
    organization_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Quote Item Schemas
class QuoteItemBase(BaseModel):
    """Base quote item schema"""
    product_id: int = Field(..., description="Product ID")
    quantity: int = Field(..., description="Quantity", ge=1)
    unit_price: Decimal = Field(..., description="Unit price", ge=0)
    discount_percent: Decimal = Field(0, description="Discount percentage", ge=0, le=100)
    description: Optional[str] = Field(None, description="Custom description")


class QuoteItemCreate(BaseModel):
    """Create quote item"""
    product_id: int
    quantity: int = Field(1, ge=1)
    discount_percent: Decimal = Field(0, ge=0, le=100)
    description: Optional[str] = None


class QuoteItemUpdate(BaseModel):
    """Update quote item"""
    quantity: Optional[int] = Field(None, ge=1)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    discount_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    description: Optional[str] = None


class QuoteItemResponse(QuoteItemBase):
    """Quote item response"""
    id: int
    quote_id: int
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class QuoteItemWithProduct(QuoteItemResponse):
    """Quote item with product details"""
    product: ProductResponse

    model_config = ConfigDict(from_attributes=True)


# Quote Schemas
class QuoteBase(BaseModel):
    """Base quote schema"""
    deal_id: Optional[int] = Field(None, description="Associated deal ID")
    valid_until: Optional[datetime] = Field(None, description="Quote valid until date")


class QuoteCreate(QuoteBase):
    """Create quote"""
    items: List[QuoteItemCreate] = Field(..., description="Quote line items")


class QuoteUpdate(BaseModel):
    """Update quote"""
    deal_id: Optional[int] = None
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    tax_amount: Optional[Decimal] = Field(None, ge=0)
    valid_until: Optional[datetime] = None


class QuoteResponse(QuoteBase):
    """Quote response"""
    id: int
    quote_number: str
    organization_id: int
    created_by_id: Optional[int] = None
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    currency: str
    status: str
    requires_approval: bool
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class QuoteDetail(QuoteResponse):
    """Detailed quote with items"""
    items: List[QuoteItemWithProduct] = []

    model_config = ConfigDict(from_attributes=True)


# Pricing Rule Schemas
class PricingRuleConditions(BaseModel):
    """Pricing rule conditions"""
    min_quantity: Optional[int] = Field(None, description="Minimum quantity")
    max_quantity: Optional[int] = Field(None, description="Maximum quantity")
    product_ids: Optional[List[int]] = Field(None, description="Applicable product IDs")
    customer_tier: Optional[str] = Field(None, description="Customer tier")
    min_order_value: Optional[Decimal] = Field(None, description="Minimum order value")


class PricingRuleBase(BaseModel):
    """Base pricing rule schema"""
    name: str = Field(..., description="Rule name", max_length=255)
    conditions: PricingRuleConditions = Field(..., description="Rule conditions")
    discount_type: str = Field(..., description="Discount type: percentage, fixed")
    discount_value: Decimal = Field(..., description="Discount value", ge=0)
    is_active: bool = Field(True, description="Is rule active?")
    priority: int = Field(0, description="Rule priority (higher = first)")

    @field_validator('discount_type')
    @classmethod
    def validate_discount_type(cls, v):
        if v not in ['percentage', 'fixed']:
            raise ValueError('discount_type must be "percentage" or "fixed"')
        return v


class PricingRuleCreate(PricingRuleBase):
    """Create pricing rule"""
    pass


class PricingRuleUpdate(BaseModel):
    """Update pricing rule"""
    name: Optional[str] = Field(None, max_length=255)
    conditions: Optional[PricingRuleConditions] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None
    priority: Optional[int] = None

    @field_validator('discount_type')
    @classmethod
    def validate_discount_type(cls, v):
        if v is not None and v not in ['percentage', 'fixed']:
            raise ValueError('discount_type must be "percentage" or "fixed"')
        return v


class PricingRuleResponse(PricingRuleBase):
    """Pricing rule response"""
    id: int
    organization_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Quote Actions
class QuoteStatusUpdate(BaseModel):
    """Update quote status"""
    status: str = Field(..., description="Status: draft, sent, accepted, rejected")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v not in ['draft', 'sent', 'accepted', 'rejected']:
            raise ValueError('status must be one of: draft, sent, accepted, rejected')
        return v


class QuoteApprovalRequest(BaseModel):
    """Request quote approval"""
    approver_id: int = Field(..., description="User ID to approve")
    notes: Optional[str] = Field(None, description="Approval request notes")


class QuoteApprovalResponse(BaseModel):
    """Approve or reject quote"""
    approved: bool = Field(..., description="Approve or reject")
    comments: Optional[str] = Field(None, description="Approval comments")


# Quote Calculation
class QuoteCalculationRequest(BaseModel):
    """Calculate quote totals"""
    items: List[QuoteItemCreate]
    discount_amount: Decimal = Field(0, ge=0)
    tax_rate: Decimal = Field(0, ge=0, le=100, description="Tax rate percentage")


class QuoteCalculationResponse(BaseModel):
    """Quote calculation result"""
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    items: List[Dict[str, Any]]  # Item calculations


# Product Catalog
class ProductCatalog(BaseModel):
    """Product catalog with categories"""
    categories: Dict[str, List[ProductResponse]]
    total_products: int


class ProductSearch(BaseModel):
    """Product search request"""
    query: Optional[str] = Field(None, description="Search query")
    category: Optional[str] = Field(None, description="Filter by category")
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    is_active: bool = Field(True, description="Filter active products")
