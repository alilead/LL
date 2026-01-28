from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.organization_settings import OrganizationSettings
from app.schemas.organization_settings import (
    OrganizationSettingsCreate,
    OrganizationSettingsUpdate
)

class CRUDOrganizationSettings(CRUDBase[OrganizationSettings, OrganizationSettingsCreate, OrganizationSettingsUpdate]):
    def get_by_organization(self, db: Session, *, organization_id: int) -> Optional[OrganizationSettings]:
        """Get settings for a specific organization"""
        return db.query(OrganizationSettings).filter(
            OrganizationSettings.organization_id == organization_id
        ).first()

    def create_with_organization(
        self,
        db: Session,
        *,
        obj_in: OrganizationSettingsCreate
    ) -> OrganizationSettings:
        """Create settings for an organization"""
        db_obj = OrganizationSettings(
            organization_id=obj_in.organization_id,
            timezone=obj_in.timezone,
            date_format=obj_in.date_format,
            time_format=obj_in.time_format,
            currency_id=obj_in.currency_id,
            logo_url=obj_in.logo_url,
            theme_settings=obj_in.theme_settings.dict() if obj_in.theme_settings else None,
            email_settings=obj_in.email_settings.dict() if obj_in.email_settings else None
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_settings(
        self,
        db: Session,
        *,
        db_obj: OrganizationSettings,
        obj_in: Union[OrganizationSettingsUpdate, Dict[str, Any]]
    ) -> OrganizationSettings:
        """Update organization settings"""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        # Handle nested JSON fields
        if "theme_settings" in update_data and update_data["theme_settings"]:
            current_theme = db_obj.theme_settings or {}
            update_data["theme_settings"] = {**current_theme, **update_data["theme_settings"]}

        if "email_settings" in update_data and update_data["email_settings"]:
            current_email = db_obj.email_settings or {}
            update_data["email_settings"] = {**current_email, **update_data["email_settings"]}

        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def update_logo(
        self,
        db: Session,
        *,
        organization_id: int,
        logo_url: str
    ) -> OrganizationSettings:
        """Update organization logo URL"""
        db_obj = self.get_by_organization(db, organization_id=organization_id)
        if not db_obj:
            raise ValueError("Organization settings not found")
        
        db_obj.logo_url = logo_url
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


organization_settings = CRUDOrganizationSettings(OrganizationSettings)
