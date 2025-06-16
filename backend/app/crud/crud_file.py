from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder

from app.crud.base import CRUDBase
from app.models.file import File
from app.schemas.file import FileCreate, FileUpdate


class CRUDFile(CRUDBase[File, FileCreate, FileUpdate]):
    def get_by_organization(
        self, db: Session, *, organization_id: int, skip: int = 0, limit: int = 100
    ) -> List[File]:
        return (
            db.query(self.model)
            .filter(File.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[File]:
        return (
            db.query(self.model)
            .filter(File.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )


file = CRUDFile(File)