from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from typing import Dict, Any, List
from sqlalchemy import func, and_, or_, text, desc
from app.models.lead import Lead
from app.models.task import Task, TaskStatus
from app.models.deal import Deal
from app.models.event import Event
from app.models.activity import Activity, ActivityType
from app.models.lead_stage import LeadStage
from datetime import datetime, timedelta
import logging
import random

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def get_dashboard_data(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Dict[str, Any]:
    """
    Dashboard verilerini getir
    """
    # Temel bir dashboard veri yapısı dönelim
    return {
        "status": "success",
        "data": {
            "user_id": current_user.id,
            "message": "Dashboard API endpoint çalışıyor"
        }
    } 

@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Dict[str, Any]:
    """
    Get dashboard statistics.
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Current time
        now = datetime.utcnow()
        
        # Basic time ranges for reference
        past_range = "30d"
        future_range = "next90d"
        
        # Organization bazlı filtreleme için temel koşul
        org_filter = True if current_user.is_admin else Lead.organization_id == current_user.organization_id
        
        # LEADS - Total count
        lead_count = db.query(func.count(Lead.id)).filter(org_filter).scalar() or 0
        
        # New leads today
        today_start = datetime(now.year, now.month, now.day).replace(hour=0, minute=0, second=0, microsecond=0)
        new_today = db.query(func.count(Lead.id)).filter(
            and_(
                org_filter,
                Lead.created_at >= today_start
            )
        ).scalar() or 0
        
        # New leads in last 30 days
        new_leads_30d = db.query(func.count(Lead.id)).filter(
            and_(
                org_filter,
                Lead.created_at >= now - timedelta(days=30)
            )
        ).scalar() or 0
        
        # TASKS - Open tasks (table doesn't exist in database, return 0)
        try:
            from sqlalchemy import inspect
            inspector = inspect(db.get_bind())
            if 'tasks' in inspector.get_table_names():
                task_org_filter = True if current_user.is_admin else Task.organization_id == current_user.organization_id
                task_count = db.query(func.count(Task.id)).filter(
                    and_(
                        task_org_filter,
                        Task.status.in_(['PENDING', 'IN_PROGRESS'])
                    )
                ).scalar() or 0
                
                # Overdue tasks
                overdue_tasks = db.query(func.count(Task.id)).filter(
                    and_(
                        task_org_filter,
                        Task.status.in_(['PENDING', 'IN_PROGRESS']),
                        Task.due_date < now
                    )
                ).scalar() or 0
                
                # Upcoming tasks
                upcoming_tasks = db.query(func.count(Task.id)).filter(
                    and_(
                        task_org_filter,
                        Task.due_date >= now,
                        Task.due_date <= now + timedelta(days=7),
                        Task.status != TaskStatus.COMPLETED
                    )
                ).scalar() or 0
            else:
                task_count = 0
                overdue_tasks = 0
                upcoming_tasks = 0
        except Exception as e:
            logger.error(f"Error querying tasks: {str(e)}")
            task_count = 0
            overdue_tasks = 0
            upcoming_tasks = 0
        
        # DEALS - Total count (table doesn't exist in database, return 0)
        try:
            inspector = inspect(db.get_bind())
            if 'deals' in inspector.get_table_names():
                deal_org_filter = True if current_user.is_admin else Deal.organization_id == current_user.organization_id
                deal_count = db.query(func.count(Deal.id)).filter(deal_org_filter).scalar() or 0
                
                # Closed won deals
                won_deals = db.query(func.count(Deal.id)).filter(
                    and_(
                        deal_org_filter,
                        Deal.status == 'WON'
                    )
                ).scalar() or 0
                
                # Conversion rate
                conversion_rate = 0.0
                if deal_count > 0:
                    conversion_rate = round((won_deals / deal_count) * 100, 2)
                
                # Pipeline value
                pipeline_value = db.query(func.sum(Deal.amount)).filter(
                    and_(
                        deal_org_filter,
                        Deal.status.in_(['OPEN', 'IN_PROGRESS'])
                    )
                ).scalar()
                pipeline_value = float(pipeline_value) if pipeline_value is not None else 0.0
                
                # Revenue from closed deals
                total_revenue = db.query(func.sum(Deal.amount)).filter(
                    and_(
                        deal_org_filter,
                        Deal.status == 'WON'
                    )
                ).scalar()
                total_revenue = float(total_revenue) if total_revenue is not None else 0.0
                
                # Monthly revenue
                monthly_revenue = db.query(func.sum(Deal.amount)).filter(
                    and_(
                        deal_org_filter,
                        Deal.status == 'WON',
                        Deal.accepted_at >= now - timedelta(days=30)
                    )
                ).scalar()
                monthly_revenue = float(monthly_revenue) if monthly_revenue is not None else 0.0
            else:
                deal_count = 0
                won_deals = 0
                conversion_rate = 0.0
                pipeline_value = 0.0
                total_revenue = 0.0
                monthly_revenue = 0.0
        except Exception as e:
            logger.error(f"Error querying deals: {str(e)}")
            deal_count = 0
            won_deals = 0
            conversion_rate = 0.0
            pipeline_value = 0.0
            total_revenue = 0.0
            monthly_revenue = 0.0
        
        # EVENTS - Total count
        event_count = db.query(func.count(Event.id)).filter(
            Event.organization_id == current_user.organization_id
        ).scalar() or 0
        
        # Upcoming events
        upcoming_events = db.query(func.count(Event.id)).filter(
            Event.organization_id == current_user.organization_id,
            Event.start_date >= now,
            Event.start_date <= now + timedelta(days=7)
        ).scalar() or 0
        
        # ACTIVITIES - Get recent activities (table may not exist)
        try:
            inspector = inspect(db.get_bind())
            if 'activities' in inspector.get_table_names():
                activity_org_filter = True if current_user.is_admin else Activity.organization_id == current_user.organization_id
                recent_activities = db.query(Activity).filter(activity_org_filter).order_by(Activity.created_at.desc()).limit(10).all()
            else:
                recent_activities = []
        except Exception as e:
            logger.error(f"Error querying activities: {str(e)}")
            recent_activities = []
        
        activities = []
        
        # Son leadleri ekle
        recent_leads = db.query(Lead).filter(org_filter).order_by(Lead.created_at.desc()).limit(5).all()
        for lead in recent_leads:
            lead_name = f"{lead.first_name or ''} {lead.last_name or ''}".strip() or "New Lead"
            activities.append({
                "id": f"lead_{lead.id}",
                "title": f"New Lead Added - {lead_name}",
                "description": f"Source: {lead.source or 'Direct'}",
                "type": "lead",
                "created_at": lead.created_at.isoformat() if lead.created_at else now.isoformat(),
                "entity_id": str(lead.id)
            })

        # Son dealleri ekle
        try:
            inspector = inspect(db.get_bind())
            if 'deals' in inspector.get_table_names():
                deal_org_filter = True if current_user.is_admin else Deal.organization_id == current_user.organization_id
                recent_deals = db.query(Deal).filter(deal_org_filter).order_by(Deal.created_at.desc()).limit(5).all()
            else:
                recent_deals = []
        except Exception as e:
            logger.error(f"Error querying recent deals: {str(e)}")
            recent_deals = []
            
        for deal in recent_deals:
            activities.append({
                "id": f"deal_{deal.id}",
                "title": f"New Deal Created - {deal.name or 'Unnamed Deal'}",
                "description": f"Value: ${deal.amount or 0:,.2f}",
                "type": "deal",
                "created_at": deal.created_at.isoformat() if deal.created_at else now.isoformat(),
                "entity_id": str(deal.id)
            })

        # Normal aktiviteleri ekle
        for activity in recent_activities:
            # Get the actual enum value as string
            activity_type = str(activity.type) if activity.type else "other"
            # Remove "ActivityType." prefix if it exists
            if activity_type.startswith("ActivityType."):
                activity_type = activity_type.replace("ActivityType.", "")
            
            activities.append({
                "id": str(activity.id),
                "title": activity.description or "Activity",
                "description": f"Activity type: {activity_type}",
                "type": activity_type.lower(),
                "created_at": activity.created_at.isoformat() if activity.created_at else now.isoformat(),
                "entity_id": str(activity.lead_id) if activity.lead_id else str(activity.deal_id) if activity.deal_id else None
            })

        # Aktiviteleri tarihe göre sırala ve en son 10 tanesini al
        activities = sorted(activities, key=lambda x: x["created_at"], reverse=True)[:10]
        
        # Create empty trend data - Fix type annotation errors
        lead_trend: List[Dict[str, Any]] = []
        task_trend: List[Dict[str, Any]] = []
        pipeline_trend: List[Dict[str, Any]] = []
        event_trend: List[Dict[str, Any]] = []
        
        # Log the values for debugging
        logger.info(f"Dashboard stats: Leads={lead_count}, Tasks={task_count}, Deals={deal_count}, Pipeline=${pipeline_value}")
        
        # FINAL RESPONSE - Ensure all data is correctly formatted for the frontend
        response_data = {
            "status": "success",
            "data": {
                "leads": {
                    "total": lead_count,
                    "new_today": new_today,
                    "new_leads": new_leads_30d,
                    "trend": lead_trend,
                    "date_range": past_range
                },
                "tasks": {
                    "open": task_count,
                    "upcoming": upcoming_tasks,
                    "overdue": overdue_tasks,
                    "trend": task_trend,
                    "date_range": past_range
                },
                "deals": {
                    "total": deal_count,
                    "won": won_deals,
                    "conversion_rate": conversion_rate,
                    "date_range": future_range
                },
                "revenue": {
                    "total": round(total_revenue, 2),
                    "monthly": round(monthly_revenue, 2),
                    "pipeline": pipeline_value,
                    "trend": pipeline_trend,
                    "date_range": future_range
                },
                "events": {
                    "total": event_count,
                    "upcoming": upcoming_events,
                    "trend": event_trend,
                    "date_range": past_range
                },
                "user": {
                    "tokens": 1000
                },
                "activities": activities,
                "opportunities": {
                    "total": deal_count,
                    "won": won_deals,
                    "conversion_rate": conversion_rate,
                    "pipeline_value": pipeline_value,
                    "pipeline_trend": pipeline_trend,
                    "date_range": future_range
                },
                "meetings": {
                    "upcoming": upcoming_events,
                    "trend": event_trend,
                    "date_range": past_range
                }
            }
        }
        
        # Debug log the response
        logger.info(f"Response data prepared successfully. Leads: {response_data['data']['leads']['total']}")
        
        return response_data
    except Exception as e:
        logger.error(f"Error retrieving dashboard stats: {str(e)}")
        # Include traceback for better debugging
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving dashboard stats: {str(e)}"
        ) 