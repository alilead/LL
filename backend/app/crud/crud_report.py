from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case, desc, distinct
from app.crud.base import CRUDBase
from app.models.report import Report
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.task import Task
from app.models.communication import Communication
from app.models.user import User
from app.models.deal import Deal
from app.models.event import Event
from app.schemas.report import *

class CRUDReport(CRUDBase[Report, Any, Any]):
    def get_dashboard_stats(
        self,
        db: Session,
        *,
        organization_id: Optional[int] = None,
        user_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> DashboardStats:
        """Get comprehensive dashboard statistics."""
        
        # Base query filters
        base_filters = []
        if organization_id:
            base_filters.append(Lead.organization_id == organization_id)
        
        # Date range filter
        date_filter = and_(
            Lead.created_at >= start_date,
            Lead.created_at <= end_date
        )

        # Lead funnel stats - using stage_id instead of status
        lead_stats = db.query(
            func.count(Lead.id).label('total_leads'),
            func.count(case((Lead.stage_id == 1, 1))).label('new_leads'),
            func.count(case((Lead.stage_id == 2, 1))).label('qualified_leads'),
            func.count(case((Lead.stage_id == 3, 1))).label('opportunities'),
            func.count(case((Lead.stage_id >= 4, 1))).label('won_deals')
        ).filter(
            *base_filters,
            date_filter
        ).first()

        # Deal stats for revenue
        deal_stats = db.query(
            func.sum(Deal.amount).label('total_revenue'),
            func.avg(Deal.amount).label('avg_deal_size'),
            func.count(case((Deal.status == 'Closed_Won', 1))).label('won_deals'),
            func.count(Deal.id).label('total_deals')
        ).filter(
            Deal.organization_id == organization_id if organization_id else True,
            Deal.created_at >= start_date,
            Deal.created_at <= end_date
        ).first()

        # Task stats
        task_stats = db.query(
            func.count(Task.id).label('total_tasks'),
            func.count(case((Task.status == 'completed', 1))).label('completed_tasks'),
            func.count(case((and_(Task.status != 'completed', Task.due_date < datetime.now()), 1))).label('overdue_tasks'),
            func.avg(Task.completed_at - Task.created_at).label('avg_completion_time')
        ).filter(
            Task.organization_id == organization_id if organization_id else True,
            Task.created_at >= start_date,
            Task.created_at <= end_date
        ).first()

        # Pipeline stats (from Deals table)
        pipeline_stats = db.query(
            func.sum(Deal.amount).label('total_value'),
            func.count(Deal.id).label('total_deals'),
            func.count(case((Deal.status == 'Closed_Won', 1))).label('won_deals'),
            func.count(case((Deal.status == 'Lead', 1))).label('open_deals')
        ).filter(
            Deal.organization_id == organization_id if organization_id else True,
            Deal.status.in_(['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed_Won']),
            Deal.created_at >= start_date,
            Deal.created_at <= end_date
        ).first()

        # Stage distribution from Deals
        stage_dist = db.query(
            Deal.stage,
            func.count(Deal.id).label('count'),
            func.sum(Deal.value).label('value')
        ).filter(
            Deal.organization_id == organization_id if organization_id else True,
            Deal.status.in_(['open', 'in_progress']),  # Only active deals
            Deal.created_at >= start_date,
            Deal.created_at <= end_date
        ).group_by(Deal.stage).all()

        stage_distribution = {
            stage: {
                'count': count,
                'value': float(value or 0)
            } for stage, count, value in stage_dist
        }

        # Upcoming events (next 7 days) - only meetings and calls
        now = datetime.now()
        week_later = now + timedelta(days=7)
        
        upcoming_events = db.query(Event).filter(
            Event.organization_id == organization_id if organization_id else True,
            Event.start_time >= now,
            Event.start_time <= week_later,
            Event.event_type.in_(['meeting', 'call'])  # Only meetings and calls
        ).order_by(Event.start_time.asc()).all()

        # Calculate conversion rates
        total_leads = lead_stats.total_leads or 0
        qualified_leads = lead_stats.qualified_leads or 0
        opportunities = lead_stats.opportunities or 0
        won_deals = lead_stats.won_deals or 0

        conversion_rates = {
            "lead_to_qualified": (qualified_leads / total_leads * 100) if total_leads > 0 else 0,
            "qualified_to_opportunity": (opportunities / qualified_leads * 100) if qualified_leads > 0 else 0,
            "opportunity_to_won": (won_deals / opportunities * 100) if opportunities > 0 else 0,
            "overall": (won_deals / total_leads * 100) if total_leads > 0 else 0
        }

        # Calculate win rates and probabilities based on actual data
        won_deals = pipeline_stats.won_deals or 0
        total_deals = pipeline_stats.total_deals or 1  # Avoid division by zero
        overall_win_rate = (won_deals / total_deals) * 100

        # Calculate stage-specific win probabilities
        stage_probabilities = {
            'qualification': overall_win_rate * 0.2,
            'proposal': overall_win_rate * 0.4,
            'negotiation': overall_win_rate * 0.6,
            'closing': overall_win_rate * 0.8
        }

        # Calculate average stage duration (in days) based on completed deals
        stage_durations = db.query(
            Deal.stage,
            func.avg(Deal.updated_at - Deal.created_at).label('duration')
        ).filter(
            Deal.organization_id == organization_id if organization_id else True,
            Deal.status == 'won',
            Deal.created_at >= start_date,
            Deal.created_at <= end_date
        ).group_by(Deal.stage).all()

        stage_duration_dict = {}
        for stage, duration in stage_durations:
            if duration:
                stage_duration_dict[stage] = duration.total_seconds() / (24 * 3600)  # Convert to days
            else:
                stage_duration_dict[stage] = 5.0  # Default duration if no data

        # User activity stats (only for admins)
        user_stats = None
        if not organization_id:  # Admin user
            user_stats = db.query(
                func.count(distinct(User.id)).label('active_users'),
                func.count(Communication.id).label('total_actions')
            ).outerjoin(
                Communication,
                and_(
                    Communication.user_id == User.id,
                    Communication.created_at >= start_date,
                    Communication.created_at <= end_date
                )
            ).filter(User.is_active == True).first()

            most_active = db.query(
                User.id,
                User.first_name,
                User.last_name,
                func.count(Communication.id).label('actions')
            ).join(
                Communication,
                Communication.user_id == User.id
            ).filter(
                Communication.created_at >= start_date,
                Communication.created_at <= end_date
            ).group_by(User.id).order_by(desc('actions')).limit(5).all()

            activity_types = db.query(
                Communication.type,
                func.count(Communication.id).label('count')
            ).filter(
                Communication.created_at >= start_date,
                Communication.created_at <= end_date
            ).group_by(Communication.type).all()

        return DashboardStats(
            lead_funnel=LeadFunnelStats(
                total_leads=total_leads,
                new_leads=lead_stats.new_leads or 0,
                qualified_leads=qualified_leads,
                opportunities=pipeline_stats.total_deals or 0,  # Use total deals as opportunities
                won_deals=pipeline_stats.won_deals or 0,
                conversion_rates=conversion_rates
            ),
            sales_performance=SalesPerformanceStats(
                total_revenue=float(deal_stats.total_revenue or 0),
                average_deal_size=float(deal_stats.avg_deal_size or 0),
                win_rate=float(overall_win_rate),
                sales_cycle_length=float(30),  # Default to 30 days
                top_performers=[{
                    'userId': p.user_id,
                    'name': f"{p.first_name} {p.last_name}",
                    'revenue': float(p.revenue or 0),
                    'deals': p.deals
                } for p in top_performers]
            ),
            task_completion=TaskCompletionStats(
                total_tasks=task_stats.total_tasks or 0,
                completed_tasks=task_stats.completed_tasks or 0,
                overdue_tasks=task_stats.overdue_tasks or 0,
                completion_rate=float((task_stats.completed_tasks / task_stats.total_tasks * 100) if task_stats.total_tasks else 0),
                average_completion_time=float(task_stats.avg_completion_time.total_seconds() / 3600 if task_stats.avg_completion_time else 0)
            ),
            opportunity_pipeline=OpportunityPipelineStats(
                total_value=float(pipeline_stats.total_value or 0),
                stage_distribution=stage_distribution,
                average_stage_duration=stage_duration_dict,
                win_probability=stage_probabilities
            ),
            upcoming_events=[{
                'id': event.id,
                'title': event.title,
                'start_time': event.start_time.isoformat(),
                'end_time': event.end_time.isoformat() if event.end_time else None,
                'type': event.event_type,
                'status': event.status
            } for event in upcoming_events],
            user_activity=UserActivityStats(
                active_users=user_stats.active_users if user_stats else 0,
                total_actions=user_stats.total_actions if user_stats else 0,
                average_actions_per_user=float(user_stats.total_actions / user_stats.active_users if user_stats and user_stats.active_users else 0),
                most_active_users=[{
                    'userId': u.id,
                    'name': f"{u.first_name} {u.last_name}",
                    'actions': u.actions
                } for u in most_active] if not organization_id else [],
                activity_breakdown={t.type: t.count for t in activity_types} if not organization_id else {}
            ) if not organization_id else None,
            system_health=SystemHealthStats(
                system_uptime=99.9,
                api_response_time=0.2,
                error_rate=0.1,
                storage_usage={"total": 1000, "used": 250},
                active_sessions=user_stats.active_users if user_stats else 0
            ) if not organization_id else None
        )

    def generate_report(
        self,
        db: Session,
        *,
        organization_id: Optional[int],
        user_id: int,
        report_type: ReportType,
        report_format: ReportFormat,
        start_date: datetime,
        end_date: datetime,
        filters: Optional[Dict[str, Any]] = None
    ) -> Report:
        """Generate a custom report."""
        report_data = {
            "organization_id": organization_id,
            "user_id": user_id,
            "name": f"{report_type.value} Report",
            "description": f"Generated {report_type.value} report from {start_date} to {end_date}",
            "report_type": report_type,
            "report_format": report_format,
            "filters": filters,
            "status": "pending",
            "created_at": datetime.now()
        }
        
        report = Report(**report_data)
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return report

    def get_scheduled_reports(
        self,
        db: Session,
        *,
        organization_id: Optional[int],
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Report]:
        """Get list of scheduled reports."""
        query = db.query(self.model)
        if organization_id:
            query = query.filter(self.model.organization_id == organization_id)
        return query.offset(skip).limit(limit).all()

    def schedule_report(
        self,
        db: Session,
        *,
        organization_id: Optional[int],
        user_id: int,
        report_type: ReportType,
        report_format: ReportFormat,
        schedule: Dict[str, Any],
        filters: Optional[Dict[str, Any]] = None
    ) -> Report:
        """Schedule a recurring report."""
        report_data = {
            "organization_id": organization_id,
            "user_id": user_id,
            "name": f"Scheduled {report_type.value} Report",
            "description": f"Scheduled {report_type.value} report",
            "report_type": report_type,
            "report_format": report_format,
            "filters": filters,
            "schedule": schedule,
            "status": "scheduled",
            "created_at": datetime.now()
        }
        
        report = Report(**report_data)
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return report

    def remove_scheduled_report(
        self,
        db: Session,
        *,
        id: int
    ) -> Report:
        """Delete a scheduled report."""
        return super().remove(db, id=id)


report = CRUDReport(Report)
