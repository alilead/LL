"""
Dashboard and Widget Schemas

Pydantic schemas for custom dashboards and widgets.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# Widget Schemas
class WidgetBase(BaseModel):
    """Base widget schema"""
    name: str = Field(..., description="Widget name")
    widget_type: str = Field(..., description="Widget type: chart, table, metric, list")
    data_source: str = Field(..., description="Data source: leads, deals, activities, custom")
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Widget-specific configuration")


class WidgetCreate(WidgetBase):
    """Create widget"""
    pass


class WidgetUpdate(BaseModel):
    """Update widget"""
    name: Optional[str] = None
    widget_type: Optional[str] = None
    data_source: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None


class WidgetResponse(WidgetBase):
    """Widget response"""
    id: int
    dashboard_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Dashboard Schemas
class DashboardBase(BaseModel):
    """Base dashboard schema"""
    name: str = Field(..., description="Dashboard name", max_length=255)
    description: Optional[str] = Field(None, description="Dashboard description")
    layout: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list,
        description="Grid layout configuration: [{id, x, y, w, h, widget_id}]"
    )
    is_default: bool = Field(False, description="Is this the default dashboard?")
    is_public: bool = Field(False, description="Is this dashboard public to all users?")


class DashboardCreate(DashboardBase):
    """Create dashboard"""
    widgets: Optional[List[WidgetCreate]] = Field(default_factory=list, description="Initial widgets")


class DashboardUpdate(BaseModel):
    """Update dashboard"""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    layout: Optional[List[Dict[str, Any]]] = None
    is_default: Optional[bool] = None
    is_public: Optional[bool] = None


class DashboardResponse(DashboardBase):
    """Dashboard response"""
    id: int
    organization_id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    widgets: List[WidgetResponse] = []

    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    """Dashboard summary (without widgets)"""
    id: int
    name: str
    description: Optional[str] = None
    is_default: bool
    is_public: bool
    created_at: datetime
    widgets_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# Layout Schemas
class LayoutItem(BaseModel):
    """Grid layout item"""
    id: str = Field(..., description="Layout item ID")
    x: int = Field(..., description="X position in grid")
    y: int = Field(..., description="Y position in grid")
    w: int = Field(..., description="Width in grid units")
    h: int = Field(..., description="Height in grid units")
    widget_id: int = Field(..., description="Associated widget ID")


class LayoutUpdate(BaseModel):
    """Update dashboard layout"""
    layout: List[LayoutItem] = Field(..., description="New layout configuration")


# Widget Data Schemas
class ChartConfig(BaseModel):
    """Chart widget configuration"""
    chart_type: str = Field(..., description="pie, bar, line, area, funnel")
    metric: str = Field(..., description="Metric to display")
    group_by: Optional[str] = Field(None, description="Group data by field")
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    date_range: Optional[str] = Field("last_30_days", description="Date range for data")
    colors: Optional[List[str]] = Field(default_factory=list)


class TableConfig(BaseModel):
    """Table widget configuration"""
    columns: List[str] = Field(..., description="Columns to display")
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    sort_by: Optional[str] = None
    sort_order: Optional[str] = Field("asc", description="asc or desc")
    page_size: int = Field(10, ge=1, le=100)


class MetricConfig(BaseModel):
    """Metric widget configuration"""
    metric: str = Field(..., description="Metric to display")
    aggregation: str = Field("sum", description="sum, avg, count, min, max")
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    comparison_period: Optional[str] = Field(None, description="Compare with: previous_period, previous_year")
    format: str = Field("number", description="number, currency, percentage")


class ListConfig(BaseModel):
    """List widget configuration"""
    list_type: str = Field(..., description="recent_activities, top_deals, upcoming_tasks")
    limit: int = Field(10, ge=1, le=50)
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict)


# Widget Data Response
class WidgetData(BaseModel):
    """Widget data response"""
    widget_id: int
    data: Any = Field(..., description="Widget data (structure depends on widget type)")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
