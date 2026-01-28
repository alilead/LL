# /backend/app/crud/crud_api_token.py
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from datetime import datetime

from app.crud.base import CRUDBase
from app.models.api_token import APIToken
from app.schemas.api_token import APITokenCreate, APITokenUpdate

class CRUDAPIToken(CRUDBase[APIToken, APITokenCreate, APITokenUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: APITokenCreate, organization_id: int, user_id: int
    ) -> APIToken:
        db_obj = APIToken(
            **obj_in.dict(),
            organization_id=organization_id,
            user_id=user_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_organization(
        self, db: Session, *, organization_id: int, skip: int = 0, limit: int = 100
    ) -> List[APIToken]:
        return (
            db.query(self.model)
            .filter(APIToken.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_active_tokens(
        self, db: Session, *, organization_id: int
    ) -> List[APIToken]:
        return (
            db.query(self.model)
            .filter(
                APIToken.organization_id == organization_id,
                APIToken.is_active == True,
                (APIToken.expires_at.is_(None) | (APIToken.expires_at > datetime.utcnow()))
            )
            .all()
        )

api_token = CRUDAPIToken(APIToken)