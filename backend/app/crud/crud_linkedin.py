from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.linkedin import LinkedInTemplate, LinkedInConnection, LinkedInInteraction
from app.schemas.linkedin import (
    LinkedInTemplateCreate,
    LinkedInTemplateUpdate,
    LinkedInConnectionCreate,
    LinkedInConnectionUpdate,
    LinkedInInteractionCreate,
    LinkedInInteractionUpdate
)

class CRUDLinkedInTemplate(CRUDBase[LinkedInTemplate, LinkedInTemplateCreate, LinkedInTemplateUpdate]):
    def get_by_organization(
        self, db: Session, *, organization_id: int, skip: int = 0, limit: int = 100
    ) -> List[LinkedInTemplate]:
        return (
            db.query(self.model)
            .filter(LinkedInTemplate.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

class CRUDLinkedInConnection(CRUDBase[LinkedInConnection, LinkedInConnectionCreate, LinkedInConnectionUpdate]):
    def get_by_lead(
        self, db: Session, *, lead_id: int
    ) -> Optional[LinkedInConnection]:
        return (
            db.query(self.model)
            .filter(LinkedInConnection.lead_id == lead_id)
            .first()
        )

    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[LinkedInConnection]:
        return (
            db.query(self.model)
            .filter(LinkedInConnection.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_recent_connections(
        self, db: Session, *, user_id: int, limit: int = 10
    ) -> List[LinkedInConnection]:
        return (
            db.query(self.model)
            .filter(LinkedInConnection.user_id == user_id)
            .order_by(LinkedInConnection.connected_at.desc())
            .limit(limit)
            .all()
        )

class CRUDLinkedInInteraction(CRUDBase[LinkedInInteraction, LinkedInInteractionCreate, LinkedInInteractionUpdate]):
    def get_by_lead(
        self, db: Session, *, lead_id: int, skip: int = 0, limit: int = 100
    ) -> List[LinkedInInteraction]:
        return (
            db.query(self.model)
            .filter(LinkedInInteraction.lead_id == lead_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[LinkedInInteraction]:
        return (
            db.query(self.model)
            .filter(LinkedInInteraction.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_recent_interactions(
        self, db: Session, *, user_id: int, limit: int = 10
    ) -> List[LinkedInInteraction]:
        return (
            db.query(self.model)
            .filter(LinkedInInteraction.user_id == user_id)
            .order_by(LinkedInInteraction.created_at.desc())
            .limit(limit)
            .all()
        )

linkedin_template = CRUDLinkedInTemplate(LinkedInTemplate)
linkedin_connection = CRUDLinkedInConnection(LinkedInConnection)
linkedin_interaction = CRUDLinkedInInteraction(LinkedInInteraction) 