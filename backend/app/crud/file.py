from typing import List, Optional, Dict, Any
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.file import File
from app.schemas.file import FileCreate, FileUpdate


class FileCRUD:
    def get(self, db: Session, id: int) -> Optional[File]:
        """Get file by ID"""
        return db.query(File).filter(File.id == id).first()

    def get_multi(
        self,
        db: Session,
        organization_id: int,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get multiple files with filtering and pagination"""
        query = db.query(File).filter(File.organization_id == organization_id)

        if filters:
            if filters.get("entity_type"):
                query = query.filter(File.entity_type == filters["entity_type"])
            if filters.get("entity_id"):
                query = query.filter(File.entity_id == filters["entity_id"])
            if filters.get("mime_type"):
                query = query.filter(File.mime_type.like(f"{filters['mime_type']}%"))
            if filters.get("name"):
                query = query.filter(File.name.ilike(f"%{filters['name']}%"))

        total = query.count()
        files = query.order_by(File.created_at.desc()).offset(skip).limit(limit).all()

        return {
            "files": files,
            "total": total,
            "page": skip // limit + 1,
            "size": limit,
            "has_more": total > (skip + limit)
        }

    def get_entity_files(
        self,
        db: Session,
        organization_id: int,
        entity_type: str,
        entity_id: int
    ) -> List[File]:
        """Get all files for a specific entity"""
        return db.query(File).filter(
            and_(
                File.organization_id == organization_id,
                File.entity_type == entity_type,
                File.entity_id == entity_id
            )
        ).all()

    def create(
        self,
        db: Session,
        *,
        obj_in: FileCreate
    ) -> File:
        """Create new file record"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = File(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: File,
        obj_in: FileUpdate
    ) -> File:
        """Update file record"""
        obj_data = jsonable_encoder(db_obj)
        update_data = obj_in.dict(exclude_unset=True)
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(
        self,
        db: Session,
        *,
        id: int
    ) -> File:
        """Delete file record"""
        obj = db.query(File).get(id)
        db.delete(obj)
        db.commit()
        return obj


file = FileCRUD()
