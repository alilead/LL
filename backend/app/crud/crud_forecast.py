"""
CRUD operations for Forecasting
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta

from app.models.forecast import (
    ForecastPeriod, Forecast, ForecastItem, 
    ForecastHistory, ForecastRollup,
    ForecastStatus, ForecastCategory
)
from app.schemas.forecast import ForecastPeriodCreate, ForecastCreate, ForecastUpdate


class CRUDForecastPeriod:
    """CRUD for Forecast Periods"""

    def get(self, db: Session, period_id: int) -> Optional[ForecastPeriod]:
        return db.query(ForecastPeriod).filter(ForecastPeriod.id == period_id).first()

    def get_multi(
        self, db: Session, *, organization_id: int, skip: int = 0, limit: int = 100
    ) -> List[ForecastPeriod]:
        return db.query(ForecastPeriod).filter(
            ForecastPeriod.organization_id == organization_id
        ).order_by(desc(ForecastPeriod.start_date)).offset(skip).limit(limit).all()

    def get_active(self, db: Session, organization_id: int) -> Optional[ForecastPeriod]:
        """Get current active period"""
        return db.query(ForecastPeriod).filter(
            and_(
                ForecastPeriod.organization_id == organization_id,
                ForecastPeriod.is_active == True,
                ForecastPeriod.is_closed == False
            )
        ).first()

    def create(
        self, db: Session, *, obj_in: ForecastPeriodCreate, organization_id: int
    ) -> ForecastPeriod:
        period = ForecastPeriod(**obj_in.dict(), organization_id=organization_id)
        db.add(period)
        db.commit()
        db.refresh(period)
        return period


class CRUDForecast:
    """CRUD for Forecasts"""

    def get(self, db: Session, forecast_id: int) -> Optional[Forecast]:
        return db.query(Forecast).filter(Forecast.id == forecast_id).first()

    def get_by_user_period(
        self, db: Session, *, user_id: int, period_id: int, territory_id: Optional[int] = None
    ) -> Optional[Forecast]:
        query = db.query(Forecast).filter(
            and_(
                Forecast.user_id == user_id,
                Forecast.period_id == period_id
            )
        )
        if territory_id:
            query = query.filter(Forecast.territory_id == territory_id)
        return query.first()

    def get_multi_by_period(
        self, db: Session, *, period_id: int, skip: int = 0, limit: int = 100
    ) -> List[Forecast]:
        return db.query(Forecast).filter(
            Forecast.period_id == period_id
        ).offset(skip).limit(limit).all()

    def create(
        self, db: Session, *, obj_in: ForecastCreate, user_id: int, organization_id: int
    ) -> Forecast:
        forecast = Forecast(
            **obj_in.dict(),
            user_id=user_id,
            organization_id=organization_id
        )
        db.add(forecast)
        db.commit()
        db.refresh(forecast)
        return forecast

    def update(self, db: Session, *, forecast: Forecast, obj_in: ForecastUpdate) -> Forecast:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(forecast, field, value)
        
        forecast.updated_at = datetime.utcnow()
        db.add(forecast)
        db.commit()
        db.refresh(forecast)
        return forecast

    def submit(self, db: Session, *, forecast: Forecast) -> Forecast:
        """Submit forecast for approval"""
        forecast.status = ForecastStatus.SUBMITTED
        forecast.submitted_at = datetime.utcnow()
        db.add(forecast)
        db.commit()
        db.refresh(forecast)
        return forecast

    def adjust(
        self, db: Session, *, forecast: Forecast, 
        adjusted_commit: float, reason: str, adjusted_by_id: int
    ) -> Forecast:
        """Manager adjustment"""
        forecast.manager_adjusted_commit = adjusted_commit
        forecast.adjustment_reason = reason
        forecast.adjusted_by_id = adjusted_by_id
        forecast.adjusted_at = datetime.utcnow()
        db.add(forecast)
        db.commit()
        db.refresh(forecast)
        return forecast


class CRUDForecastRollup:
    """CRUD for Forecast Rollups"""

    def calculate_rollup(
        self, db: Session, *, period_id: int, rollup_level: str, 
        entity_id: Optional[int], organization_id: int
    ) -> ForecastRollup:
        """Calculate and store rollup"""
        # Get all forecasts for this level
        query = db.query(Forecast).filter(Forecast.period_id == period_id)
        
        if rollup_level == "user" and entity_id:
            query = query.filter(Forecast.user_id == entity_id)
        elif rollup_level == "territory" and entity_id:
            query = query.filter(Forecast.territory_id == entity_id)
        # For organization level, include all
        
        forecasts = query.all()
        
        # Aggregate
        pipeline = sum(f.pipeline_amount for f in forecasts)
        best_case = sum(f.best_case_amount for f in forecasts)
        commit = sum(f.commit_amount for f in forecasts)
        closed = sum(f.closed_amount for f in forecasts)
        adjusted = sum(f.final_commit_amount for f in forecasts)
        
        pipeline_cnt = sum(f.pipeline_count for f in forecasts)
        best_case_cnt = sum(f.best_case_count for f in forecasts)
        commit_cnt = sum(f.commit_count for f in forecasts)
        closed_cnt = sum(f.closed_count for f in forecasts)
        
        total_quota = sum(f.quota_amount or 0 for f in forecasts)
        quota_att = (closed / total_quota * 100) if total_quota > 0 else 0
        
        # Check if exists
        rollup = db.query(ForecastRollup).filter(
            and_(
                ForecastRollup.period_id == period_id,
                ForecastRollup.rollup_level == rollup_level,
                ForecastRollup.entity_id == entity_id
            )
        ).first()
        
        if rollup:
            # Update
            rollup.pipeline_amount = pipeline
            rollup.best_case_amount = best_case
            rollup.commit_amount = commit
            rollup.closed_amount = closed
            rollup.adjusted_commit_amount = adjusted
            rollup.pipeline_count = pipeline_cnt
            rollup.best_case_count = best_case_cnt
            rollup.commit_count = commit_cnt
            rollup.closed_count = closed_cnt
            rollup.total_quota = total_quota
            rollup.quota_attainment = quota_att
            rollup.calculated_at = datetime.utcnow()
        else:
            # Create
            rollup = ForecastRollup(
                period_id=period_id,
                organization_id=organization_id,
                rollup_level=rollup_level,
                entity_id=entity_id,
                pipeline_amount=pipeline,
                best_case_amount=best_case,
                commit_amount=commit,
                closed_amount=closed,
                adjusted_commit_amount=adjusted,
                pipeline_count=pipeline_cnt,
                best_case_count=best_case_cnt,
                commit_count=commit_cnt,
                closed_count=closed_cnt,
                total_quota=total_quota,
                quota_attainment=quota_att
            )
            db.add(rollup)
        
        db.commit()
        db.refresh(rollup)
        return rollup


# Create instances
crud_forecast_period = CRUDForecastPeriod()
crud_forecast = CRUDForecast()
crud_forecast_rollup = CRUDForecastRollup()
