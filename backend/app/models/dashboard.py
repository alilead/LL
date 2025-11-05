"""
Dashboard and Reporting Models

Custom dashboards with widgets, charts, and real-time data.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum


class Dashboard(Base):
    """Custom dashboard"""
    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"))

    # Layout configuration (grid system)
    layout = Column(JSON)  # [{id, x, y, w, h, widget_id}]
    is_default = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    widgets = relationship("DashboardWidget", back_populates="dashboard", cascade="all, delete-orphan")
    organization = relationship("Organization")


class DashboardWidget(Base):
    """Dashboard widget"""
    __tablename__ = "dashboard_widgets"

    id = Column(Integer, primary_key=True)
    dashboard_id = Column(Integer, ForeignKey("dashboards.id"))
    name = Column(String(255))
    widget_type = Column(String(50))  # chart, table, metric, list
    data_source = Column(String(100))  # leads, deals, activities, custom
    configuration = Column(JSON)  # Widget-specific config

    created_at = Column(DateTime, default=datetime.utcnow)

    dashboard = relationship("Dashboard", back_populates="widgets")
