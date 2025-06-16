from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.organization import Organization
from app.models.organization_settings import OrganizationSettings
from app.models.role import Role
from app.models.user import User
from app.schemas.organization import OrganizationUpdate, OrganizationSettingsUpdate

class OrganizationService:
    @staticmethod
    def get_organization_stats(db: Session, organization_id: int) -> Dict[str, Any]:
        """Get organization dashboard statistics"""
        org = db.query(Organization).filter(Organization.id == organization_id).first()
        if not org:
            return None

        return {
            "total_leads": len(org.leads),
            "total_users": len(org.users),
            "total_deals": len(org.deals),
            "total_tasks": len(org.tasks),
            "recent_activities": [
                {
                    "id": activity.id,
                    "type": activity.type,
                    "description": activity.description,
                    "created_at": activity.created_at
                }
                for activity in org.activities[:10]  # Last 10 activities
            ],
            "lead_stages": [
                {
                    "stage": stage.name,
                    "count": len(stage.leads)
                }
                for stage in org.lead_stages
            ]
        }

    @staticmethod
    def update_organization(
        db: Session,
        organization_id: int,
        data: OrganizationUpdate
    ) -> Optional[Organization]:
        """Update organization details"""
        org = db.query(Organization).filter(Organization.id == organization_id).first()
        if not org:
            return None

        for field, value in data.dict(exclude_unset=True).items():
            setattr(org, field, value)

        db.commit()
        db.refresh(org)
        return org

    @staticmethod
    def update_settings(
        db: Session,
        organization_id: int,
        data: OrganizationSettingsUpdate
    ) -> Optional[OrganizationSettings]:
        """Update organization settings"""
        settings = db.query(OrganizationSettings).filter(
            OrganizationSettings.organization_id == organization_id
        ).first()

        if not settings:
            settings = OrganizationSettings(organization_id=organization_id)
            db.add(settings)

        for field, value in data.dict(exclude_unset=True).items():
            if field == "theme_settings":
                settings.theme_settings = {
                    **settings.theme_settings if settings.theme_settings else {},
                    **value
                }
            elif field == "email_settings":
                settings.email_settings = {
                    **settings.email_settings if settings.email_settings else {},
                    **value
                }
            else:
                setattr(settings, field, value)

        db.commit()
        db.refresh(settings)
        return settings

    @staticmethod
    def get_organization_users(
        db: Session,
        organization_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Get all users in an organization"""
        return db.query(User).filter(
            User.organization_id == organization_id
        ).offset(skip).limit(limit).all()

    @staticmethod
    def create_role(
        db: Session,
        organization_id: int,
        name: str,
        permissions: str
    ) -> Role:
        """Create a new role in the organization"""
        role = Role(
            organization_id=organization_id,
            name=name,
            permissions=permissions
        )
        db.add(role)
        db.commit()
        db.refresh(role)
        return role

    @staticmethod
    def assign_role(
        db: Session,
        user_id: int,
        role_id: int,
        organization_id: int
    ) -> bool:
        """Assign a role to a user"""
        user = db.query(User).filter(
            User.id == user_id,
            User.organization_id == organization_id
        ).first()
        
        role = db.query(Role).filter(
            Role.id == role_id,
            Role.organization_id == organization_id
        ).first()

        if not user or not role:
            return False

        user.roles.append(role)
        db.commit()
        return True

    @staticmethod
    def remove_role(
        db: Session,
        user_id: int,
        role_id: int,
        organization_id: int
    ) -> bool:
        """Remove a role from a user"""
        user = db.query(User).filter(
            User.id == user_id,
            User.organization_id == organization_id
        ).first()
        
        role = db.query(Role).filter(
            Role.id == role_id,
            Role.organization_id == organization_id
        ).first()

        if not user or not role or role not in user.roles:
            return False

        user.roles.remove(role)
        db.commit()
        return True
