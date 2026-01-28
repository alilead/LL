from typing import Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder

from app.models.organization_settings import OrganizationSettings
from app.schemas.organization_settings import OrganizationSettingsCreate, OrganizationSettingsUpdate


class OrganizationSettingsCRUD:
    def get_by_organization(
        self, 
        db: Session, 
        organization_id: int
    ) -> Optional[OrganizationSettings]:
        """Get settings for an organization"""
        return db.query(OrganizationSettings).filter(
            OrganizationSettings.organization_id == organization_id
        ).first()

    def create(
        self,
        db: Session,
        *,
        obj_in: OrganizationSettingsCreate
    ) -> OrganizationSettings:
        """Create new organization settings"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = OrganizationSettings(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: OrganizationSettings,
        obj_in: Union[OrganizationSettingsUpdate, Dict[str, Any]]
    ) -> OrganizationSettings:
        """Update organization settings"""
        obj_data = jsonable_encoder(db_obj)
        
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        # Handle nested JSON fields
        if "theme_settings" in update_data:
            current_theme = obj_data.get("theme_settings", {})
            if isinstance(current_theme, dict):
                current_theme.update(update_data["theme_settings"])
            else:
                current_theme = update_data["theme_settings"]
            update_data["theme_settings"] = current_theme

        if "email_settings" in update_data:
            current_email = obj_data.get("email_settings", {})
            if isinstance(current_email, dict):
                current_email.update(update_data["email_settings"])
            else:
                current_email = update_data["email_settings"]
            update_data["email_settings"] = current_email

        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_logo(
        self,
        db: Session,
        *,
        organization_id: int,
        logo_url: str
    ) -> OrganizationSettings:
        """Update organization logo"""
        settings = self.get_by_organization(db, organization_id)
        if not settings:
            return None
        
        settings.logo_url = logo_url
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings


organization_settings = OrganizationSettingsCRUD()
