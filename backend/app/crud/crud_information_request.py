from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.information_request import InformationRequest
from app.schemas.information_request import InformationRequestCreate, InformationRequestUpdate

class CRUDInformationRequest(CRUDBase[InformationRequest, InformationRequestCreate, InformationRequestUpdate]):
    def get_by_lead(self, db: Session, lead_id: int) -> List[InformationRequest]:
        return db.query(self.model).filter(self.model.lead_id == lead_id).all()

    def get_by_user(self, db: Session, user_id: int) -> List[InformationRequest]:
        return db.query(self.model).filter(self.model.requested_by == user_id).all()

    def get_all(self, db: Session) -> List[InformationRequest]:
        return db.query(self.model).all()

    def create(self, db: Session, *, obj_in: dict) -> InformationRequest:
        db_obj = InformationRequest(
            lead_id=obj_in["lead_id"],
            requested_by=obj_in["requested_by"],
            field_name=obj_in["field_name"],
            notes=obj_in.get("notes")
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

information_request = CRUDInformationRequest(InformationRequest)
