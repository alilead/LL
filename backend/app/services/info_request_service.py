from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.models.info_request import InfoRequest, RequestStatus
from app.schemas.info_request import InfoRequestCreate, InfoRequestUpdate
from app.core.security import get_current_user_id

class InfoRequestService:
    @staticmethod
    def create_request(db: Session, request: InfoRequestCreate, user_id: int) -> InfoRequest:
        db_request = InfoRequest(
            **request.dict(),
            requested_by=user_id
        )
        db.add(db_request)
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def get_requests(
        db: Session,
        lead_id: Optional[int] = None,
        status: Optional[RequestStatus] = None,
        assigned_to: Optional[int] = None
    ) -> List[InfoRequest]:
        query = db.query(InfoRequest)
        
        if lead_id:
            query = query.filter(InfoRequest.lead_id == lead_id)
        if status:
            query = query.filter(InfoRequest.status == status)
        if assigned_to:
            query = query.filter(InfoRequest.assigned_to == assigned_to)
            
        return query.order_by(InfoRequest.created_at.desc()).all()

    @staticmethod
    def update_request(
        db: Session,
        request_id: int,
        update_data: InfoRequestUpdate
    ) -> Optional[InfoRequest]:
        request = db.query(InfoRequest).filter(InfoRequest.id == request_id).first()
        if not request:
            return None

        # Update status and set completed_at if status is COMPLETED
        if update_data.status == RequestStatus.COMPLETED and request.status != RequestStatus.COMPLETED:
            request.completed_at = datetime.utcnow()
        
        for key, value in update_data.dict(exclude_unset=True).items():
            setattr(request, key, value)

        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    def get_request_by_id(db: Session, request_id: int) -> Optional[InfoRequest]:
        return db.query(InfoRequest).filter(InfoRequest.id == request_id).first()

    @staticmethod
    def delete_request(db: Session, request_id: int) -> bool:
        request = db.query(InfoRequest).filter(InfoRequest.id == request_id).first()
        if not request:
            return False
        
        db.delete(request)
        db.commit()
        return True
