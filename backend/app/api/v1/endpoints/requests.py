from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.api import deps
from datetime import datetime

router = APIRouter()

@router.post("/info-request", response_model=schemas.InfoRequest)
def create_info_request(
    *,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_user),
    request_in: schemas.InfoRequestCreate,
) -> Any:
    """
    Create new information request for a lead field.
    """
    try:
        # Check if lead exists and user has access
        lead = crud.lead.get(db=db, id=request_in.lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        if lead.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

        # Create request
        request_data = request_in.dict()
        request_data["requested_by"] = current_user.id
        request_data["organization_id"] = current_user.organization_id
        request_data["created_at"] = datetime.utcnow()
        
        request = crud.info_request.create(db=db, obj_in=request_data)
        return request
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
