"""
CRUD operations for CPQ (Configure-Price-Quote)
"""

from typing import List, Optional, Dict, Any
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from datetime import datetime

from app.models.cpq import Product, Quote, QuoteItem, PricingRule
from app.schemas.cpq import (
    ProductCreate, ProductUpdate,
    QuoteCreate, QuoteUpdate, QuoteItemCreate,
    PricingRuleCreate, PricingRuleUpdate
)


class CRUDProduct:
    """CRUD operations for Product"""

    def get(self, db: Session, product_id: int) -> Optional[Product]:
        """Get product by ID"""
        return db.query(Product).filter(Product.id == product_id).first()

    def get_by_sku(self, db: Session, sku: str, organization_id: int) -> Optional[Product]:
        """Get product by SKU"""
        return db.query(Product).filter(
            and_(
                Product.sku == sku,
                Product.organization_id == organization_id
            )
        ).first()

    def get_multi(
        self,
        db: Session,
        *,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = True,
        category: Optional[str] = None
    ) -> List[Product]:
        """Get multiple products"""
        query = db.query(Product).filter(Product.organization_id == organization_id)

        if is_active is not None:
            query = query.filter(Product.is_active == is_active)

        if category:
            query = query.filter(Product.category == category)

        return query.offset(skip).limit(limit).all()

    def search(
        self,
        db: Session,
        *,
        organization_id: int,
        query_text: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None
    ) -> List[Product]:
        """Search products"""
        query = db.query(Product).filter(
            and_(
                Product.organization_id == organization_id,
                Product.is_active == True
            )
        )

        if query_text:
            search_term = f"%{query_text}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.sku.ilike(search_term)
                )
            )

        if category:
            query = query.filter(Product.category == category)

        if min_price is not None:
            query = query.filter(Product.base_price >= min_price)

        if max_price is not None:
            query = query.filter(Product.base_price <= max_price)

        return query.all()

    def create(
        self,
        db: Session,
        *,
        obj_in: ProductCreate,
        organization_id: int
    ) -> Product:
        """Create new product"""
        # Check SKU uniqueness
        existing = self.get_by_sku(db, obj_in.sku, organization_id)
        if existing:
            raise ValueError(f"Product with SKU '{obj_in.sku}' already exists")

        product = Product(
            **obj_in.model_dump(),
            organization_id=organization_id
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    def update(
        self,
        db: Session,
        *,
        product: Product,
        obj_in: ProductUpdate
    ) -> Product:
        """Update product"""
        update_data = obj_in.model_dump(exclude_unset=True)

        # Check SKU uniqueness if changing SKU
        if "sku" in update_data:
            existing = self.get_by_sku(db, update_data["sku"], product.organization_id)
            if existing and existing.id != product.id:
                raise ValueError(f"Product with SKU '{update_data['sku']}' already exists")

        for field, value in update_data.items():
            setattr(product, field, value)

        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    def delete(self, db: Session, *, product_id: int) -> bool:
        """Delete product (soft delete)"""
        product = self.get(db, product_id)
        if product:
            product.is_active = False
            db.add(product)
            db.commit()
            return True
        return False


class CRUDQuote:
    """CRUD operations for Quote"""

    def get(self, db: Session, quote_id: int) -> Optional[Quote]:
        """Get quote by ID with items"""
        return db.query(Quote).options(
            joinedload(Quote.items)
        ).filter(Quote.id == quote_id).first()

    def get_by_number(self, db: Session, quote_number: str) -> Optional[Quote]:
        """Get quote by quote number"""
        return db.query(Quote).filter(Quote.quote_number == quote_number).first()

    def get_multi(
        self,
        db: Session,
        *,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        deal_id: Optional[int] = None
    ) -> List[Quote]:
        """Get multiple quotes"""
        query = db.query(Quote).filter(Quote.organization_id == organization_id)

        if status:
            query = query.filter(Quote.status == status)

        if deal_id:
            query = query.filter(Quote.deal_id == deal_id)

        return query.order_by(Quote.created_at.desc()).offset(skip).limit(limit).all()

    def create(
        self,
        db: Session,
        *,
        obj_in: QuoteCreate,
        organization_id: int,
        created_by_id: int
    ) -> Quote:
        """Create new quote with line items"""
        # Generate quote number
        quote_number = self._generate_quote_number(db, organization_id)

        # Create quote
        quote = Quote(
            quote_number=quote_number,
            organization_id=organization_id,
            created_by_id=created_by_id,
            deal_id=obj_in.deal_id,
            valid_until=obj_in.valid_until,
            subtotal=0,
            discount_amount=0,
            tax_amount=0,
            total_amount=0,
            status="draft"
        )
        db.add(quote)
        db.flush()  # Get quote ID

        # Create quote items
        for item_data in obj_in.items:
            product = db.query(Product).filter(Product.id == item_data.product_id).first()
            if not product:
                raise ValueError(f"Product {item_data.product_id} not found")

            # Apply pricing rules
            unit_price = self._calculate_unit_price(
                db,
                product=product,
                quantity=item_data.quantity,
                organization_id=organization_id
            )

            # Calculate line total with discount
            discount_multiplier = (100 - item_data.discount_percent) / 100
            line_total = unit_price * item_data.quantity * discount_multiplier

            item = QuoteItem(
                quote_id=quote.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=unit_price,
                discount_percent=item_data.discount_percent,
                line_total=line_total,
                description=item_data.description
            )
            db.add(item)

        # Calculate quote totals
        quote = self._recalculate_totals(db, quote)

        # Check if requires approval (e.g., high discount)
        quote.requires_approval = self._check_requires_approval(quote)

        db.commit()
        db.refresh(quote)
        return quote

    def update(
        self,
        db: Session,
        *,
        quote: Quote,
        obj_in: QuoteUpdate
    ) -> Quote:
        """Update quote"""
        update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(quote, field, value)

        # Recalculate if discount or tax changed
        if "discount_amount" in update_data or "tax_amount" in update_data:
            quote = self._recalculate_totals(db, quote)

        db.add(quote)
        db.commit()
        db.refresh(quote)
        return quote

    def add_item(
        self,
        db: Session,
        *,
        quote: Quote,
        item_in: QuoteItemCreate
    ) -> Quote:
        """Add item to quote"""
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        if not product:
            raise ValueError(f"Product {item_in.product_id} not found")

        # Calculate pricing
        unit_price = self._calculate_unit_price(
            db,
            product=product,
            quantity=item_in.quantity,
            organization_id=quote.organization_id
        )

        discount_multiplier = (100 - item_in.discount_percent) / 100
        line_total = unit_price * item_in.quantity * discount_multiplier

        item = QuoteItem(
            quote_id=quote.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity,
            unit_price=unit_price,
            discount_percent=item_in.discount_percent,
            line_total=line_total,
            description=item_in.description
        )
        db.add(item)

        # Recalculate totals
        quote = self._recalculate_totals(db, quote)

        db.commit()
        db.refresh(quote)
        return quote

    def remove_item(self, db: Session, *, quote: Quote, item_id: int) -> Quote:
        """Remove item from quote"""
        item = db.query(QuoteItem).filter(
            and_(
                QuoteItem.id == item_id,
                QuoteItem.quote_id == quote.id
            )
        ).first()

        if item:
            db.delete(item)
            quote = self._recalculate_totals(db, quote)
            db.commit()
            db.refresh(quote)

        return quote

    def update_status(
        self,
        db: Session,
        *,
        quote: Quote,
        status: str
    ) -> Quote:
        """Update quote status"""
        quote.status = status

        if status == "sent" and not quote.sent_at:
            quote.sent_at = datetime.utcnow()
        elif status == "accepted" and not quote.accepted_at:
            quote.accepted_at = datetime.utcnow()

        db.add(quote)
        db.commit()
        db.refresh(quote)
        return quote

    def approve(
        self,
        db: Session,
        *,
        quote: Quote,
        approved_by_id: int
    ) -> Quote:
        """Approve quote"""
        quote.approved_by_id = approved_by_id
        quote.approved_at = datetime.utcnow()
        quote.requires_approval = False

        db.add(quote)
        db.commit()
        db.refresh(quote)
        return quote

    def _generate_quote_number(self, db: Session, organization_id: int) -> str:
        """Generate unique quote number"""
        # Get count of quotes for org
        count = db.query(func.count(Quote.id)).filter(
            Quote.organization_id == organization_id
        ).scalar()

        # Format: Q-YYYYMMDD-NNNN
        date_str = datetime.utcnow().strftime("%Y%m%d")
        return f"Q-{date_str}-{count + 1:04d}"

    def _calculate_unit_price(
        self,
        db: Session,
        *,
        product: Product,
        quantity: int,
        organization_id: int
    ) -> Decimal:
        """Calculate unit price with pricing rules"""
        base_price = product.base_price

        # Get applicable pricing rules
        rules = db.query(PricingRule).filter(
            and_(
                PricingRule.organization_id == organization_id,
                PricingRule.is_active == True
            )
        ).order_by(PricingRule.priority.desc()).all()

        # Apply first matching rule
        for rule in rules:
            if self._rule_applies(rule, product, quantity):
                if rule.discount_type == "percentage":
                    discount = base_price * (rule.discount_value / 100)
                    return base_price - discount
                elif rule.discount_type == "fixed":
                    return max(base_price - rule.discount_value, Decimal(0))

        return base_price

    def _rule_applies(
        self,
        rule: PricingRule,
        product: Product,
        quantity: int
    ) -> bool:
        """Check if pricing rule applies"""
        conditions = rule.conditions

        # Check quantity
        if "min_quantity" in conditions:
            if quantity < conditions["min_quantity"]:
                return False

        if "max_quantity" in conditions:
            if quantity > conditions["max_quantity"]:
                return False

        # Check product IDs
        if "product_ids" in conditions and conditions["product_ids"]:
            if product.id not in conditions["product_ids"]:
                return False

        return True

    def _recalculate_totals(self, db: Session, quote: Quote) -> Quote:
        """Recalculate quote totals"""
        items = db.query(QuoteItem).filter(QuoteItem.quote_id == quote.id).all()

        subtotal = sum(item.line_total for item in items)
        discount = quote.discount_amount or Decimal(0)
        tax = quote.tax_amount or Decimal(0)

        quote.subtotal = subtotal
        quote.total_amount = subtotal - discount + tax

        return quote

    def _check_requires_approval(self, quote: Quote) -> bool:
        """Check if quote requires approval"""
        # Implement approval logic (e.g., high discounts, large amounts)
        if quote.total_amount > 10000:
            return True

        # Check if any item has high discount
        for item in quote.items:
            if item.discount_percent > 20:
                return True

        return False


class CRUDPricingRule:
    """CRUD operations for Pricing Rules"""

    def get(self, db: Session, rule_id: int) -> Optional[PricingRule]:
        """Get pricing rule by ID"""
        return db.query(PricingRule).filter(PricingRule.id == rule_id).first()

    def get_multi(
        self,
        db: Session,
        *,
        organization_id: int,
        is_active: Optional[bool] = True
    ) -> List[PricingRule]:
        """Get multiple pricing rules"""
        query = db.query(PricingRule).filter(PricingRule.organization_id == organization_id)

        if is_active is not None:
            query = query.filter(PricingRule.is_active == is_active)

        return query.order_by(PricingRule.priority.desc()).all()

    def create(
        self,
        db: Session,
        *,
        obj_in: PricingRuleCreate,
        organization_id: int
    ) -> PricingRule:
        """Create new pricing rule"""
        # Convert conditions to dict
        conditions_dict = obj_in.conditions.model_dump(exclude_none=True)

        rule = PricingRule(
            name=obj_in.name,
            organization_id=organization_id,
            conditions=conditions_dict,
            discount_type=obj_in.discount_type,
            discount_value=obj_in.discount_value,
            is_active=obj_in.is_active,
            priority=obj_in.priority
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule

    def update(
        self,
        db: Session,
        *,
        rule: PricingRule,
        obj_in: PricingRuleUpdate
    ) -> PricingRule:
        """Update pricing rule"""
        update_data = obj_in.model_dump(exclude_unset=True)

        # Convert conditions if provided
        if "conditions" in update_data and update_data["conditions"]:
            update_data["conditions"] = update_data["conditions"].model_dump(exclude_none=True)

        for field, value in update_data.items():
            setattr(rule, field, value)

        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule

    def delete(self, db: Session, *, rule_id: int) -> bool:
        """Delete pricing rule"""
        rule = self.get(db, rule_id)
        if rule:
            db.delete(rule)
            db.commit()
            return True
        return False


# Create instances
crud_product = CRUDProduct()
crud_quote = CRUDQuote()
crud_pricing_rule = CRUDPricingRule()
