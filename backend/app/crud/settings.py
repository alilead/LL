from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.settings import OrganizationSettings, EmailSettings, EmailTemplate
from app.schemas.settings import (
    OrganizationSettingsCreate,
    OrganizationSettingsUpdate,
    EmailSettingsCreate,
    EmailSettingsUpdate,
    EmailTemplateCreate,
    EmailTemplateUpdate,
)

class CRUDOrganizationSettings(CRUDBase[OrganizationSettings, OrganizationSettingsCreate, OrganizationSettingsUpdate]):
    def get_by_organization(self, db: Session, *, organization_id: int) -> Optional[OrganizationSettings]:
        return db.query(self.model).filter(self.model.organization_id == organization_id).first()

    def create_or_update(
        self,
        db: Session,
        *,
        obj_in: Union[OrganizationSettingsCreate, Dict[str, Any]],
        organization_id: int
    ) -> OrganizationSettings:
        existing_settings = self.get_by_organization(db, organization_id=organization_id)
        if existing_settings:
            return self.update(db, db_obj=existing_settings, obj_in=obj_in)
        return self.create(db, obj_in=obj_in)

class CRUDEmailSettings(CRUDBase[EmailSettings, EmailSettingsCreate, EmailSettingsUpdate]):
    def get_by_organization(self, db: Session, *, organization_id: int) -> Optional[EmailSettings]:
        return db.query(self.model).filter(self.model.organization_id == organization_id).first()

    def create_or_update(
        self,
        db: Session,
        *,
        obj_in: Union[EmailSettingsCreate, Dict[str, Any]],
        organization_id: int
    ) -> EmailSettings:
        existing_settings = self.get_by_organization(db, organization_id=organization_id)
        if existing_settings:
            return self.update(db, db_obj=existing_settings, obj_in=obj_in)
        return self.create(db, obj_in=obj_in)

class CRUDEmailTemplate(CRUDBase[EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate]):
    def get_by_organization(
        self,
        db: Session,
        *,
        organization_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> list[EmailTemplate]:
        return (
            db.query(self.model)
            .filter(self.model.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_active_templates(
        self,
        db: Session,
        *,
        organization_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> list[EmailTemplate]:
        return (
            db.query(self.model)
            .filter(
                self.model.organization_id == organization_id,
                self.model.is_active == True
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

organization_settings = CRUDOrganizationSettings(OrganizationSettings)
email_settings = CRUDEmailSettings(EmailSettings)
email_template = CRUDEmailTemplate(EmailTemplate) 