"""
CRUD operations for Dashboard Management
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from datetime import datetime

from app.models.dashboard import Dashboard, DashboardWidget
from app.schemas.dashboard import (
    DashboardCreate, DashboardUpdate,
    WidgetCreate, WidgetUpdate
)


class CRUDDashboard:
    """CRUD operations for Dashboard"""

    def get(self, db: Session, dashboard_id: int) -> Optional[Dashboard]:
        """Get dashboard by ID"""
        return db.query(Dashboard).options(
            joinedload(Dashboard.widgets)
        ).filter(Dashboard.id == dashboard_id).first()

    def get_multi(
        self,
        db: Session,
        *,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        is_public: Optional[bool] = None,
        created_by_id: Optional[int] = None
    ) -> List[Dashboard]:
        """Get multiple dashboards"""
        query = db.query(Dashboard).filter(Dashboard.organization_id == organization_id)

        if is_public is not None:
            query = query.filter(Dashboard.is_public == is_public)

        if created_by_id is not None:
            query = query.filter(Dashboard.created_by_id == created_by_id)

        return query.offset(skip).limit(limit).all()

    def get_default(self, db: Session, organization_id: int) -> Optional[Dashboard]:
        """Get default dashboard for organization"""
        return db.query(Dashboard).filter(
            and_(
                Dashboard.organization_id == organization_id,
                Dashboard.is_default == True
            )
        ).first()

    def get_user_dashboards(
        self,
        db: Session,
        *,
        organization_id: int,
        user_id: int
    ) -> List[Dashboard]:
        """Get dashboards accessible by a user (public + owned)"""
        return db.query(Dashboard).filter(
            and_(
                Dashboard.organization_id == organization_id,
                or_(
                    Dashboard.is_public == True,
                    Dashboard.created_by_id == user_id
                )
            )
        ).all()

    def create(
        self,
        db: Session,
        *,
        obj_in: DashboardCreate,
        organization_id: int,
        created_by_id: int
    ) -> Dashboard:
        """Create new dashboard"""
        # If setting as default, unset other defaults
        if obj_in.is_default:
            db.query(Dashboard).filter(
                Dashboard.organization_id == organization_id
            ).update({"is_default": False})

        # Create dashboard without widgets first
        dashboard_data = obj_in.model_dump(exclude={'widgets'})
        dashboard = Dashboard(
            **dashboard_data,
            organization_id=organization_id,
            created_by_id=created_by_id
        )
        db.add(dashboard)
        db.flush()  # Get the dashboard ID

        # Create widgets if provided
        if obj_in.widgets:
            for widget_data in obj_in.widgets:
                widget = DashboardWidget(
                    dashboard_id=dashboard.id,
                    **widget_data.model_dump()
                )
                db.add(widget)

        db.commit()
        db.refresh(dashboard)
        return dashboard

    def update(
        self,
        db: Session,
        *,
        dashboard: Dashboard,
        obj_in: DashboardUpdate
    ) -> Dashboard:
        """Update dashboard"""
        update_data = obj_in.model_dump(exclude_unset=True)

        # If setting as default, unset other defaults
        if update_data.get("is_default"):
            db.query(Dashboard).filter(
                and_(
                    Dashboard.organization_id == dashboard.organization_id,
                    Dashboard.id != dashboard.id
                )
            ).update({"is_default": False})

        for field, value in update_data.items():
            setattr(dashboard, field, value)

        dashboard.updated_at = datetime.utcnow()
        db.add(dashboard)
        db.commit()
        db.refresh(dashboard)
        return dashboard

    def update_layout(
        self,
        db: Session,
        *,
        dashboard: Dashboard,
        layout: List[Dict[str, Any]]
    ) -> Dashboard:
        """Update dashboard layout"""
        dashboard.layout = layout
        dashboard.updated_at = datetime.utcnow()
        db.add(dashboard)
        db.commit()
        db.refresh(dashboard)
        return dashboard

    def delete(self, db: Session, *, dashboard_id: int) -> bool:
        """Delete dashboard"""
        dashboard = self.get(db, dashboard_id)
        if dashboard:
            db.delete(dashboard)
            db.commit()
            return True
        return False

    def clone(
        self,
        db: Session,
        *,
        dashboard_id: int,
        new_name: str,
        created_by_id: int
    ) -> Optional[Dashboard]:
        """Clone a dashboard with all its widgets"""
        original = self.get(db, dashboard_id)
        if not original:
            return None

        # Create new dashboard
        cloned = Dashboard(
            name=new_name,
            description=f"Cloned from: {original.name}",
            organization_id=original.organization_id,
            created_by_id=created_by_id,
            layout=original.layout,
            is_default=False,
            is_public=False
        )
        db.add(cloned)
        db.flush()

        # Clone widgets
        for widget in original.widgets:
            cloned_widget = DashboardWidget(
                dashboard_id=cloned.id,
                name=widget.name,
                widget_type=widget.widget_type,
                data_source=widget.data_source,
                configuration=widget.configuration
            )
            db.add(cloned_widget)

        db.commit()
        db.refresh(cloned)
        return cloned


class CRUDDashboardWidget:
    """CRUD operations for Dashboard Widgets"""

    def get(self, db: Session, widget_id: int) -> Optional[DashboardWidget]:
        """Get widget by ID"""
        return db.query(DashboardWidget).filter(DashboardWidget.id == widget_id).first()

    def get_by_dashboard(
        self,
        db: Session,
        dashboard_id: int
    ) -> List[DashboardWidget]:
        """Get all widgets for a dashboard"""
        return db.query(DashboardWidget).filter(
            DashboardWidget.dashboard_id == dashboard_id
        ).all()

    def create(
        self,
        db: Session,
        *,
        dashboard_id: int,
        obj_in: WidgetCreate
    ) -> DashboardWidget:
        """Create new widget"""
        widget = DashboardWidget(
            dashboard_id=dashboard_id,
            **obj_in.model_dump()
        )
        db.add(widget)
        db.commit()
        db.refresh(widget)
        return widget

    def update(
        self,
        db: Session,
        *,
        widget: DashboardWidget,
        obj_in: WidgetUpdate
    ) -> DashboardWidget:
        """Update widget"""
        update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(widget, field, value)

        db.add(widget)
        db.commit()
        db.refresh(widget)
        return widget

    def delete(self, db: Session, *, widget_id: int) -> bool:
        """Delete widget"""
        widget = self.get(db, widget_id)
        if widget:
            db.delete(widget)
            db.commit()
            return True
        return False

    def get_widget_data(
        self,
        db: Session,
        *,
        widget: DashboardWidget,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get data for a widget based on its configuration.

        This is a placeholder that should be implemented with actual
        data aggregation logic based on widget type and data source.
        """
        # TODO: Implement actual data fetching based on:
        # - widget.widget_type (chart, table, metric, list)
        # - widget.data_source (leads, deals, activities, custom)
        # - widget.configuration (specific config for the widget)
        # - filters (additional runtime filters)

        result = {
            "widget_id": widget.id,
            "widget_type": widget.widget_type,
            "data_source": widget.data_source,
            "data": {},
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "configuration": widget.configuration
            }
        }

        # Placeholder logic - implement real data aggregation
        if widget.widget_type == "metric":
            result["data"] = {
                "value": 0,
                "change": 0,
                "change_percentage": 0
            }
        elif widget.widget_type == "chart":
            result["data"] = {
                "labels": [],
                "datasets": []
            }
        elif widget.widget_type == "table":
            result["data"] = {
                "columns": [],
                "rows": [],
                "total": 0
            }
        elif widget.widget_type == "list":
            result["data"] = {
                "items": []
            }

        return result


# Create instances
crud_dashboard = CRUDDashboard()
crud_dashboard_widget = CRUDDashboardWidget()
