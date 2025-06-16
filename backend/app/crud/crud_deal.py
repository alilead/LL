from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func
from app.crud.base import CRUDBase
from app.models.deal import Deal, DealStatus
from app.schemas.deal import DealCreate, DealUpdate
from datetime import datetime

class CRUDDeal(CRUDBase[Deal, DealCreate, DealUpdate]):
    def get(self, db: Session, deal_id: int) -> Optional[Deal]:
        return db.query(Deal).filter(Deal.id == deal_id).first()

    def get_multi_base(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Deal]:
        """Base get_multi method from CRUDBase"""
        return super().get_multi(db, skip=skip, limit=limit)

    def get_multi(
        self,
        db: Session,
        *,
        user_id: Optional[int] = None,
        lead_id: Optional[int] = None,
        status: Optional[DealStatus] = None,
        organization_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "expected_close_date",
        sort_desc: bool = True
    ) -> List[Deal]:
        query = db.query(Deal)

        if organization_id is not None:
            query = query.filter(Deal.organization_id == organization_id)

        if user_id is not None:
            query = query.filter(Deal.user_id == user_id)
        
        if lead_id is not None:
            query = query.filter(Deal.lead_id == lead_id)
            
        if status is not None:
            query = query.filter(Deal.status == status)

        # Apply sorting
        if hasattr(Deal, sort_by):
            order_by = desc(getattr(Deal, sort_by)) if sort_desc else asc(getattr(Deal, sort_by))
            query = query.order_by(order_by)

        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: DealCreate) -> Deal:
        # Convert Pydantic model to dict and add timestamps
        obj_data = obj_in.model_dump()
        obj_data["created_at"] = datetime.utcnow()
        obj_data["updated_at"] = datetime.utcnow()
        
        # Create DB object
        db_obj = Deal(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Deal, obj_in: DealUpdate) -> Deal:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
        
    def get_pipeline_summary(self, db: Session, *, user_id: Optional[int] = None, organization_id: Optional[int] = None) -> Dict:
        """Get pipeline summary statistics grouped by status"""
        query = db.query(Deal)
        
        if organization_id is not None:
            query = query.filter(Deal.organization_id == organization_id)
            
        if user_id is not None:
            query = query.filter(Deal.user_id == user_id)

        # Initialize summary dict with all possible statuses
        summary = {status: {"count": 0, "value": 0.0, "deals": []} for status in DealStatus}
        
        # Get all relevant deals
        deals = query.all()
        
        # Group deals by status and calculate statistics
        for deal in deals:
            status_summary = summary[deal.status]
            status_summary["count"] += 1
            status_summary["value"] += deal.amount or 0.0
            status_summary["deals"].append(deal)
            
        return summary

    def delete(self, db: Session, *, deal_id: int) -> Deal:
        obj = db.query(Deal).get(deal_id)
        db.delete(obj)
        db.commit()
        return obj

    def get_by_lead(self, db: Session, *, lead_id: int) -> List[Deal]:
        return db.query(Deal).filter(Deal.lead_id == lead_id).all()

    def get_by_user(self, db: Session, *, user_id: int) -> List[Deal]:
        return db.query(Deal).filter(Deal.user_id == user_id).all()

    def count(self, db: Session) -> int:
        return db.query(Deal).count()

deal = CRUDDeal(Deal)

__all__ = ["deal"]
