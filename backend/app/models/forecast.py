"""
Collaborative Forecasting Models

Enterprise sales forecasting with hierarchical rollups and AI predictions.
Supports:
- Multiple forecast categories (pipeline, best case, commit, closed)
- Time-based periods (weekly, monthly, quarterly, annual)
- Hierarchical rollups (user, team, territory, organization)
- Manager overrides and adjustments
- Historical trending and analysis
- Quota vs forecast tracking
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, JSON, Enum as SQLEnum, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum


class ForecastCategory(str, enum.Enum):
    """Forecast categories based on opportunity stages"""
    PIPELINE = "pipeline"  # All open opportunities
    BEST_CASE = "best_case"  # High probability deals
    COMMIT = "commit"  # Committed deals
    CLOSED = "closed"  # Closed won
    OMITTED = "omitted"  # Excluded from forecast


class ForecastPeriodType(str, enum.Enum):
    """Forecast period types"""
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


class ForecastStatus(str, enum.Enum):
    """Forecast submission status"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class ForecastPeriod(Base):
    """
    Defines forecast periods for an organization.
    """
    __tablename__ = "forecast_periods"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    # Period definition
    name = Column(String(255), nullable=False)  # e.g., "Q1 2025", "January 2025"
    period_type = Column(SQLEnum(ForecastPeriodType), nullable=False)
    year = Column(Integer, nullable=False, index=True)
    quarter = Column(Integer, nullable=True)  # 1-4 for quarterly
    month = Column(Integer, nullable=True)  # 1-12 for monthly
    week = Column(Integer, nullable=True)  # 1-53 for weekly

    # Date range
    start_date = Column(DateTime, nullable=False, index=True)
    end_date = Column(DateTime, nullable=False, index=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_closed = Column(Boolean, default=False)  # Once closed, no more updates allowed

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization")
    forecasts = relationship("Forecast", back_populates="period", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('organization_id', 'year', 'quarter', 'month', 'week', name='unique_period'),
    )

    def __repr__(self):
        return f"<ForecastPeriod {self.name}>"


class Forecast(Base):
    """
    Individual user forecast for a specific period.
    Supports hierarchical rollups and manager adjustments.
    """
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    period_id = Column(Integer, ForeignKey("forecast_periods.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    # Territory (optional)
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=True, index=True)

    # Forecast amounts by category
    pipeline_amount = Column(Float, default=0.0)
    best_case_amount = Column(Float, default=0.0)
    commit_amount = Column(Float, default=0.0)
    closed_amount = Column(Float, default=0.0)

    # Opportunity counts by category
    pipeline_count = Column(Integer, default=0)
    best_case_count = Column(Integer, default=0)
    commit_count = Column(Integer, default=0)
    closed_count = Column(Integer, default=0)

    # Manager adjustments (overrides)
    manager_adjusted_commit = Column(Float, nullable=True)  # Manager override of commit
    adjustment_reason = Column(Text, nullable=True)
    adjusted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    adjusted_at = Column(DateTime, nullable=True)

    # AI predictions
    ai_predicted_commit = Column(Float, nullable=True)
    ai_confidence_score = Column(Float, nullable=True)  # 0-100
    ai_prediction_date = Column(DateTime, nullable=True)

    # Quota for this period
    quota_amount = Column(Float, nullable=True)

    # Status
    status = Column(SQLEnum(ForecastStatus), default=ForecastStatus.DRAFT, index=True)
    submitted_at = Column(DateTime, nullable=True)

    # Currency
    currency = Column(String(3), default="USD")

    # Metadata
    metadata = Column(JSON, nullable=True)  # Additional forecast data

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    period = relationship("ForecastPeriod", back_populates="forecasts")
    user = relationship("User", foreign_keys=[user_id])
    adjusted_by = relationship("User", foreign_keys=[adjusted_by_id])
    organization = relationship("Organization")
    territory = relationship("Territory")
    items = relationship("ForecastItem", back_populates="forecast", cascade="all, delete-orphan")
    history = relationship("ForecastHistory", back_populates="forecast", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('period_id', 'user_id', 'territory_id', name='unique_user_period_forecast'),
    )

    def __repr__(self):
        return f"<Forecast User:{self.user_id} Period:{self.period_id}>"

    @property
    def quota_attainment(self) -> float:
        """Calculate quota attainment percentage based on closed amount"""
        if not self.quota_amount or self.quota_amount == 0:
            return 0.0
        return (self.closed_amount / self.quota_amount) * 100

    @property
    def final_commit_amount(self) -> float:
        """Get the final commit amount (manager adjusted or regular)"""
        return self.manager_adjusted_commit if self.manager_adjusted_commit is not None else self.commit_amount


class ForecastItem(Base):
    """
    Individual opportunities/deals included in a forecast.
    Links forecast to actual pipeline data.
    """
    __tablename__ = "forecast_items"

    id = Column(Integer, primary_key=True, index=True)
    forecast_id = Column(Integer, ForeignKey("forecasts.id"), nullable=False, index=True)

    # Linked opportunity/deal
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False, index=True)

    # Forecast category for this item
    forecast_category = Column(SQLEnum(ForecastCategory), nullable=False, index=True)

    # Amount and probability
    amount = Column(Float, nullable=False)
    probability = Column(Integer, default=0)  # 0-100
    weighted_amount = Column(Float, nullable=False)  # amount * probability

    # Close date
    expected_close_date = Column(DateTime, nullable=True)

    # Override (if manually adjusted)
    is_manual_override = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    forecast = relationship("Forecast", back_populates="items")
    deal = relationship("Deal")

    def __repr__(self):
        return f"<ForecastItem Deal:{self.deal_id} Category:{self.forecast_category}>"


class ForecastHistory(Base):
    """
    Historical snapshot of forecasts for trending analysis.
    Captures forecast state at different points in time.
    """
    __tablename__ = "forecast_history"

    id = Column(Integer, primary_key=True, index=True)
    forecast_id = Column(Integer, ForeignKey("forecasts.id"), nullable=False, index=True)

    # Snapshot date
    snapshot_date = Column(DateTime, nullable=False, index=True)

    # Forecast amounts at snapshot time
    pipeline_amount = Column(Float, default=0.0)
    best_case_amount = Column(Float, default=0.0)
    commit_amount = Column(Float, default=0.0)
    closed_amount = Column(Float, default=0.0)

    # Manager adjustment at snapshot time
    manager_adjusted_commit = Column(Float, nullable=True)

    # Changes since last snapshot
    pipeline_change = Column(Float, default=0.0)
    commit_change = Column(Float, default=0.0)
    closed_change = Column(Float, default=0.0)

    # Metadata
    change_reason = Column(Text, nullable=True)  # Why did forecast change?

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    forecast = relationship("Forecast", back_populates="history")

    def __repr__(self):
        return f"<ForecastHistory Forecast:{self.forecast_id} Date:{self.snapshot_date}>"


class ForecastRollup(Base):
    """
    Aggregated forecast rollups at different hierarchy levels.
    Pre-calculated for performance (updated via background job).
    """
    __tablename__ = "forecast_rollups"

    id = Column(Integer, primary_key=True, index=True)
    period_id = Column(Integer, ForeignKey("forecast_periods.id"), nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    # Hierarchy level
    rollup_level = Column(String(50), nullable=False, index=True)  # user, team, territory, organization
    entity_id = Column(Integer, nullable=True, index=True)  # ID of user/team/territory (null for org level)

    # Aggregated amounts
    pipeline_amount = Column(Float, default=0.0)
    best_case_amount = Column(Float, default=0.0)
    commit_amount = Column(Float, default=0.0)
    closed_amount = Column(Float, default=0.0)

    # With manager adjustments
    adjusted_commit_amount = Column(Float, default=0.0)

    # Opportunity counts
    pipeline_count = Column(Integer, default=0)
    best_case_count = Column(Integer, default=0)
    commit_count = Column(Integer, default=0)
    closed_count = Column(Integer, default=0)

    # Quota aggregation
    total_quota = Column(Float, default=0.0)
    quota_attainment = Column(Float, default=0.0)  # percentage

    # Timestamps
    calculated_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    period = relationship("ForecastPeriod")
    organization = relationship("Organization")

    __table_args__ = (
        UniqueConstraint('period_id', 'rollup_level', 'entity_id', name='unique_rollup'),
    )

    def __repr__(self):
        return f"<ForecastRollup {self.rollup_level}:{self.entity_id} Period:{self.period_id}>"


class ForecastComment(Base):
    """
    Comments and notes on forecasts.
    """
    __tablename__ = "forecast_comments"

    id = Column(Integer, primary_key=True, index=True)
    forecast_id = Column(Integer, ForeignKey("forecasts.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Comment
    comment = Column(Text, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    forecast = relationship("Forecast")
    user = relationship("User")

    def __repr__(self):
        return f"<ForecastComment {self.id}>"
