"""
Forecasting API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.forecast import (
    ForecastPeriodCreate, ForecastPeriodResponse,
    ForecastCreate, ForecastUpdate, ForecastResponse, ForecastAdjustment,
    ForecastRollupResponse, ForecastAnalytics, TeamForecastSummary
)
from app.crud.crud_forecast import crud_forecast_period, crud_forecast, crud_forecast_rollup

router = APIRouter()

# Forecast Period Endpoints

@router.get("/periods", response_model=List[ForecastPeriodResponse])
def list_forecast_periods(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """List all forecast periods"""
    periods = crud_forecast_period.get_multi(
        db, organization_id=current_user.organization_id, skip=skip, limit=limit
    )
    return [ForecastPeriodResponse(**p.__dict__) for p in periods]


@router.post("/periods", response_model=ForecastPeriodResponse, status_code=status.HTTP_201_CREATED)
def create_forecast_period(
    period_in: ForecastPeriodCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Create a new forecast period"""
    period = crud_forecast_period.create(
        db, obj_in=period_in, organization_id=current_user.organization_id
    )
    return ForecastPeriodResponse(**period.__dict__)


@router.get("/periods/active", response_model=ForecastPeriodResponse)
def get_active_period(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get current active forecast period"""
    period = crud_forecast_period.get_active(db, current_user.organization_id)
    if not period:
        raise HTTPException(status_code=404, detail="No active forecast period")
    return ForecastPeriodResponse(**period.__dict__)


# Forecast Endpoints

@router.get("/", response_model=List[ForecastResponse])
def list_forecasts(
    period_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """List forecasts for a period"""
    forecasts = crud_forecast.get_multi_by_period(db, period_id=period_id, skip=skip, limit=limit)
    return [ForecastResponse(
        **f.__dict__,
        quota_attainment=f.quota_attainment,
        final_commit_amount=f.final_commit_amount
    ) for f in forecasts]


@router.get("/my", response_model=ForecastResponse)
def get_my_forecast(
    period_id: int,
    territory_id: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get my forecast for a period"""
    forecast = crud_forecast.get_by_user_period(
        db, user_id=current_user.id, period_id=period_id, territory_id=territory_id
    )
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return ForecastResponse(
        **forecast.__dict__,
        quota_attainment=forecast.quota_attainment,
        final_commit_amount=forecast.final_commit_amount
    )


@router.post("/", response_model=ForecastResponse, status_code=status.HTTP_201_CREATED)
def create_forecast(
    forecast_in: ForecastCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Create a forecast"""
    forecast = crud_forecast.create(
        db, obj_in=forecast_in, user_id=current_user.id, 
        organization_id=current_user.organization_id
    )
    return ForecastResponse(
        **forecast.__dict__,
        quota_attainment=forecast.quota_attainment,
        final_commit_amount=forecast.final_commit_amount
    )


@router.put("/{forecast_id}", response_model=ForecastResponse)
def update_forecast(
    forecast_id: int,
    forecast_in: ForecastUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Update forecast"""
    forecast = crud_forecast.get(db, forecast_id)
    if not forecast or forecast.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    forecast = crud_forecast.update(db, forecast=forecast, obj_in=forecast_in)
    return ForecastResponse(
        **forecast.__dict__,
        quota_attainment=forecast.quota_attainment,
        final_commit_amount=forecast.final_commit_amount
    )


@router.post("/{forecast_id}/submit", response_model=ForecastResponse)
def submit_forecast(
    forecast_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Submit forecast for approval"""
    forecast = crud_forecast.get(db, forecast_id)
    if not forecast or forecast.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    forecast = crud_forecast.submit(db, forecast=forecast)
    return ForecastResponse(
        **forecast.__dict__,
        quota_attainment=forecast.quota_attainment,
        final_commit_amount=forecast.final_commit_amount
    )


@router.post("/{forecast_id}/adjust", response_model=ForecastResponse)
def adjust_forecast(
    forecast_id: int,
    adjustment: ForecastAdjustment,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Manager adjustment to forecast"""
    forecast = crud_forecast.get(db, forecast_id)
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    # TODO: Check if user is manager
    forecast = crud_forecast.adjust(
        db, forecast=forecast,
        adjusted_commit=adjustment.manager_adjusted_commit,
        reason=adjustment.adjustment_reason or "",
        adjusted_by_id=current_user.id
    )
    return ForecastResponse(
        **forecast.__dict__,
        quota_attainment=forecast.quota_attainment,
        final_commit_amount=forecast.final_commit_amount
    )


# Rollup Endpoints

@router.get("/rollups/{period_id}", response_model=List[ForecastRollupResponse])
def get_forecast_rollups(
    period_id: int,
    rollup_level: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get forecast rollups"""
    # Calculate rollup for organization
    rollup = crud_forecast_rollup.calculate_rollup(
        db, period_id=period_id, rollup_level=rollup_level,
        entity_id=None, organization_id=current_user.organization_id
    )
    return [ForecastRollupResponse(**rollup.__dict__)]
