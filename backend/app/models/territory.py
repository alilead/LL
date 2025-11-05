"""
Territory Management Models

Hierarchical territory structures for enterprise sales organizations.
Supports:
- Territory hierarchies with parent-child relationships
- Automatic lead/account assignment based on rules
- Territory-based forecasting and reporting
- Multiple territory assignments
- Territory analytics
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, JSON, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum


class TerritoryType(str, enum.Enum):
    """Territory types"""
    GEOGRAPHIC = "geographic"
    INDUSTRY = "industry"
    ACCOUNT_SIZE = "account_size"
    PRODUCT = "product"
    CUSTOM = "custom"


class AssignmentPriority(str, enum.Enum):
    """Assignment priority for territory rules"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Territory(Base):
    """
    Territory model for hierarchical territory management.

    Territories can be organized in a hierarchy (parent-child).
    Each territory can have assignment rules, members, and quotas.
    """
    __tablename__ = "territories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    territory_type = Column(SQLEnum(TerritoryType), default=TerritoryType.CUSTOM)

    # Hierarchy
    parent_id = Column(Integer, ForeignKey("territories.id"), nullable=True, index=True)
    path = Column(String(500), nullable=True, index=True)  # Materialized path for efficient queries
    level = Column(Integer, default=0)  # Hierarchy level (0 = root)

    # Organization
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    # Status
    is_active = Column(Boolean, default=True)

    # Metadata
    metadata = Column(JSON, nullable=True)  # Store custom attributes

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    parent = relationship("Territory", remote_side=[id], backref="children")
    organization = relationship("Organization", back_populates="territories")
    members = relationship("TerritoryMember", back_populates="territory", cascade="all, delete-orphan")
    rules = relationship("TerritoryRule", back_populates="territory", cascade="all, delete-orphan")
    quotas = relationship("TerritoryQuota", back_populates="territory", cascade="all, delete-orphan")
    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self):
        return f"<Territory {self.name}>"

    @property
    def full_path(self) -> str:
        """Get the full path of the territory"""
        if not self.path:
            return self.name
        return f"{self.path}/{self.name}"


class TerritoryMember(Base):
    """
    Territory membership - assigns users to territories with specific roles.
    A user can be a member of multiple territories.
    """
    __tablename__ = "territory_members"

    id = Column(Integer, primary_key=True, index=True)
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(50), default="member")  # owner, manager, member
    is_primary = Column(Boolean, default=False)  # Is this the user's primary territory?

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    territory = relationship("Territory", back_populates="members")
    user = relationship("User", back_populates="territory_memberships")

    def __repr__(self):
        return f"<TerritoryMember {self.user_id} in {self.territory_id}>"


class TerritoryRule(Base):
    """
    Assignment rules for automatically assigning leads/accounts to territories.
    Rules are evaluated in priority order.
    """
    __tablename__ = "territory_rules"

    id = Column(Integer, primary_key=True, index=True)
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Rule configuration
    priority = Column(Integer, default=0)  # Higher number = higher priority
    priority_level = Column(SQLEnum(AssignmentPriority), default=AssignmentPriority.MEDIUM)
    is_active = Column(Boolean, default=True)

    # Conditions (stored as JSON)
    # Example: {"field": "country", "operator": "equals", "value": "USA"}
    # or: {"and": [{"field": "country", "operator": "equals", "value": "USA"},
    #              {"field": "annual_revenue", "operator": "greater_than", "value": 1000000}]}
    conditions = Column(JSON, nullable=False)

    # Target entity type
    entity_type = Column(String(50), nullable=False)  # lead, account, opportunity

    # Auto-assignment
    auto_assign = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    territory = relationship("Territory", back_populates="rules")

    def __repr__(self):
        return f"<TerritoryRule {self.name}>"


class TerritoryAssignment(Base):
    """
    Tracks which leads/accounts are assigned to which territories.
    Supports multiple territory assignments per entity.
    """
    __tablename__ = "territory_assignments"

    id = Column(Integer, primary_key=True, index=True)
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=False, index=True)

    # Polymorphic assignment (can assign leads, accounts, opportunities, etc.)
    entity_type = Column(String(50), nullable=False, index=True)  # lead, account, opportunity
    entity_id = Column(Integer, nullable=False, index=True)

    # Assignment metadata
    assigned_by_rule_id = Column(Integer, ForeignKey("territory_rules.id"), nullable=True)
    assigned_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assignment_reason = Column(Text, nullable=True)
    is_primary = Column(Boolean, default=True)  # Primary territory for this entity

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    territory = relationship("Territory")
    assigned_by_rule = relationship("TerritoryRule")
    assigned_by_user = relationship("User")

    def __repr__(self):
        return f"<TerritoryAssignment {self.entity_type}:{self.entity_id} -> Territory {self.territory_id}>"


class TerritoryQuota(Base):
    """
    Territory quotas for forecasting and goal tracking.
    """
    __tablename__ = "territory_quotas"

    id = Column(Integer, primary_key=True, index=True)
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=False, index=True)

    # Time period
    year = Column(Integer, nullable=False)
    quarter = Column(Integer, nullable=True)  # 1-4, null for annual
    month = Column(Integer, nullable=True)  # 1-12, null if not monthly

    # Quota targets
    revenue_quota = Column(Float, nullable=True)
    deal_count_quota = Column(Integer, nullable=True)
    activity_quota = Column(Integer, nullable=True)

    # Actuals (updated periodically)
    revenue_actual = Column(Float, default=0.0)
    deal_count_actual = Column(Integer, default=0)
    activity_actual = Column(Integer, default=0)

    # Currency
    currency = Column(String(3), default="USD")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    territory = relationship("Territory", back_populates="quotas")

    def __repr__(self):
        return f"<TerritoryQuota {self.territory_id} {self.year}Q{self.quarter}>"

    @property
    def revenue_attainment(self) -> float:
        """Calculate revenue quota attainment percentage"""
        if not self.revenue_quota or self.revenue_quota == 0:
            return 0.0
        return (self.revenue_actual / self.revenue_quota) * 100

    @property
    def deal_attainment(self) -> float:
        """Calculate deal count quota attainment percentage"""
        if not self.deal_count_quota or self.deal_count_quota == 0:
            return 0.0
        return (self.deal_count_actual / self.deal_count_quota) * 100
