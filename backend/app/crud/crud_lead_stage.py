from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.lead_stage import LeadStage
from app.schemas.lead_stage import LeadStageCreate, LeadStageUpdate

class CRUDLeadStage(CRUDBase[LeadStage, LeadStageCreate, LeadStageUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[LeadStage]:
        return db.query(LeadStage).filter(
            LeadStage.name == name
        ).first()

    def get_by_order_index(self, db: Session, *, order_index: int, organization_id: int) -> Optional[LeadStage]:
        """
        Get stage by order_index. Filter by organization_id and is_active.
        """
        return db.query(LeadStage).filter(
            LeadStage.order_index == order_index,
            LeadStage.organization_id == organization_id,
            LeadStage.is_active == True
        ).first()

    def get_all(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[LeadStage]:
        return db.query(LeadStage).order_by(LeadStage.order_index.asc()).offset(skip).limit(limit).all()

    def reorder_stages(
        self, db: Session, *, stage_orders: List[dict]
    ) -> List[LeadStage]:
        """
        Reorder stages based on provided order list.
        stage_orders should be a list of dicts with stage_id and new_order.
        """
        stages = []
        for stage_order in stage_orders:
            stage = db.query(LeadStage).filter(
                LeadStage.id == stage_order["stage_id"]
            ).first()
            if stage:
                stage.order_index = stage_order["new_order"]
                stages.append(stage)
        
        db.commit()
        return stages

    def get_first_stage(self, db: Session, *, organization_id: int) -> Optional[LeadStage]:
        """
        Get the first stage (lowest order_index) for an organization.
        If no stages exist, returns None.
        """
        return db.query(LeadStage).filter(
            LeadStage.organization_id == organization_id,
            LeadStage.is_active == True
        ).order_by(LeadStage.order_index.asc()).first()

lead_stage = CRUDLeadStage(LeadStage)

__all__ = ["lead_stage"]
