from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder

from app.crud.base import CRUDBase
from app.models.opportunity import Opportunity
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate


class CRUDOpportunity(CRUDBase[Opportunity, OpportunityCreate, OpportunityUpdate]):
    def get_by_organization(
        self, db: Session, *, organization_id: int, skip: int = 0, limit: int = 100
    ) -> List[Opportunity]:
        return (
            db.query(self.model)
            .filter(Opportunity.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Opportunity]:
        return (
            db.query(self.model)
            .filter(Opportunity.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_status(
        self, db: Session, *, status: str, skip: int = 0, limit: int = 100
    ) -> List[Opportunity]:
        return (
            db.query(self.model)
            .filter(Opportunity.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )


opportunity = CRUDOpportunity(Opportunity)