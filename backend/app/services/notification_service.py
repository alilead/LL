from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User
from datetime import datetime

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        link: Optional[str] = None,
        notification_type: str = "info",
        priority: str = "medium"
    ) -> Notification:
        """Create a new notification for a user"""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            link=link,
            type=notification_type,
            priority=priority,
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
    
    @staticmethod
    def create_notification_for_organization(
        db: Session,
        organization_id: int,
        title: str,
        message: str,
        link: Optional[str] = None,
        notification_type: str = "info",
        priority: str = "medium",
        exclude_user_id: Optional[int] = None
    ) -> List[Notification]:
        """Create notifications for all users in an organization"""
        # Get all users in the organization
        users_query = db.query(User).filter(User.organization_id == organization_id)
        if exclude_user_id:
            users_query = users_query.filter(User.id != exclude_user_id)
        
        users = users_query.all()
        notifications = []
        
        for user in users:
            notification = NotificationService.create_notification(
                db=db,
                user_id=user.id,
                title=title,
                message=message,
                link=link,
                notification_type=notification_type,
                priority=priority
            )
            notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def create_admin_notification(
        db: Session,
        title: str,
        message: str,
        link: Optional[str] = None,
        notification_type: str = "info",
        priority: str = "medium"
    ) -> List[Notification]:
        """Create notifications for all admin users"""
        admin_users = db.query(User).filter(User.is_admin == True).all()
        notifications = []
        
        for admin in admin_users:
            notification = NotificationService.create_notification(
                db=db,
                user_id=admin.id,
                title=title,
                message=message,
                link=link,
                notification_type=notification_type,
                priority=priority
            )
            notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def notify_lead_assignment(
        db: Session,
        assigned_user_id: int,
        lead_name: str,
        lead_id: int,
        assigned_by_user_name: str
    ):
        """Notify user when a lead is assigned to them"""
        return NotificationService.create_notification(
            db=db,
            user_id=assigned_user_id,
            title="New Lead Assigned",
            message=f"You have been assigned a new lead: {lead_name} by {assigned_by_user_name}",
            link=f"/leads/{lead_id}",
            notification_type="info",
            priority="medium"
        )
    
    @staticmethod
    def notify_team_invitation(
        db: Session,
        invited_user_id: int,
        organization_name: str,
        invited_by_name: str
    ):
        """Notify user when they are invited to a team"""
        return NotificationService.create_notification(
            db=db,
            user_id=invited_user_id,
            title="Team Invitation",
            message=f"You have been invited to join {organization_name} by {invited_by_name}",
            link="/team-management",
            notification_type="info",
            priority="high"
        )
    
    @staticmethod
    def notify_new_user_registration(
        db: Session,
        new_user_name: str,
        new_user_email: str,
        organization_id: int
    ):
        """Notify organization managers when a new user registers"""
        # Get organization managers
        managers = db.query(User).filter(
            User.organization_id == organization_id,
            User.organization_role == "MANAGER"
        ).all()
        
        notifications = []
        for manager in managers:
            notification = NotificationService.create_notification(
                db=db,
                user_id=manager.id,
                title="New User Registration",
                message=f"New user {new_user_name} ({new_user_email}) has registered",
                link="/team-management",
                notification_type="info",
                priority="medium"
            )
            notifications.append(notification)
        
        return notifications 