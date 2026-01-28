from typing import Any, Dict, Optional, Union, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from app.crud.base import CRUDBase
from app.models.communication import Communication
from app.schemas.communication import CommunicationCreate, CommunicationUpdate

class CRUDCommunication(CRUDBase[Communication, CommunicationCreate, CommunicationUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: CommunicationCreate, user_id: int
    ) -> Communication:
        obj_in_data = obj_in.model_dump()
        db_obj = Communication(**obj_in_data, user_id=user_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self,
        db: Session,
        *,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Communication]:
        query = db.query(self.model).filter(Communication.user_id == user_id)
        
        if filters:
            for field, value in filters.items():
                if value is not None:
                    if field == "type":
                        query = query.filter(Communication.type == value)
                    elif field == "status":
                        query = query.filter(Communication.status == value)
                    elif field == "lead_id":
                        query = query.filter(Communication.lead_id == value)
                    elif field == "deal_id":
                        query = query.filter(Communication.deal_id == value)
                    elif field == "date_from":
                        query = query.filter(Communication.scheduled_at >= value)
                    elif field == "date_to":
                        query = query.filter(Communication.scheduled_at <= value)
        
        return query.offset(skip).limit(limit).all()

    def get_multi_by_organization(
        self,
        db: Session,
        *,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Communication]:
        query = db.query(self.model).filter(Communication.organization_id == organization_id)
        
        if filters:
            for field, value in filters.items():
                if value is not None:
                    if field == "type":
                        query = query.filter(Communication.type == value)
                    elif field == "status":
                        query = query.filter(Communication.status == value)
                    elif field == "lead_id":
                        query = query.filter(Communication.lead_id == value)
                    elif field == "deal_id":
                        query = query.filter(Communication.deal_id == value)
                    elif field == "date_from":
                        query = query.filter(Communication.scheduled_at >= value)
                    elif field == "date_to":
                        query = query.filter(Communication.scheduled_at <= value)
        
        return query.offset(skip).limit(limit).all()

    def update(
        self,
        db: Session,
        *,
        db_obj: Communication,
        obj_in: Union[CommunicationUpdate, Dict[str, Any]]
    ) -> Communication:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        if update_data.get("status") == "completed" and not db_obj.completed_at:
            update_data["completed_at"] = datetime.utcnow()
            
        return super().update(db, db_obj=db_obj, obj_in=update_data)

communication = CRUDCommunication(Communication)
