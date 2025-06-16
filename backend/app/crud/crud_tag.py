from typing import List, Optional, Union, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.crud.base import CRUDBase
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate
from fastapi import HTTPException

class CRUDTag(CRUDBase[Tag, TagCreate, TagUpdate]):
    def get(self, db: Session, id: Optional[int] = None, tag_id: Optional[int] = None) -> Optional[Tag]:
        """Get tag by ID. Accepts either id or tag_id parameter."""
        if id is not None:
            return db.query(Tag).filter(Tag.id == id).first()
        elif tag_id is not None:
            return db.query(Tag).filter(Tag.id == tag_id).first()
        return None

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "name",
        sort_desc: bool = False
    ) -> List[Tag]:
        query = db.query(Tag)

        # Apply sorting
        if hasattr(Tag, sort_by):
            order_by = desc(getattr(Tag, sort_by)) if sort_desc else asc(getattr(Tag, sort_by))
            query = query.order_by(order_by)

        return query.offset(skip).limit(limit).all()

    def check_duplicate(
        self,
        db: Session,
        *,
        name: str,
        organization_id: int,
        exclude_id: Optional[int] = None
    ) -> Optional[Tag]:
        """Check if a tag with the same name exists in the organization"""
        query = db.query(Tag).filter(
            and_(
                Tag.name == name,
                Tag.organization_id == organization_id
            )
        )
        if exclude_id:
            query = query.filter(Tag.id != exclude_id)
        return query.first()

    def create(
        self,
        db: Session,
        *,
        obj_in: Union[TagCreate, Dict[str, Any]]
    ) -> Tag:
        """Create a new tag with duplicate check"""
        data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump()
        
        # Check for duplicate
        if existing_tag := self.check_duplicate(
            db,
            name=data["name"],
            organization_id=data["organization_id"]
        ):
            raise HTTPException(
                status_code=400,
                detail=f"A tag with name '{data['name']}' already exists in your organization"
            )
        
        return super().create(db=db, obj_in=obj_in)

    def update(
        self,
        db: Session,
        *,
        db_obj: Tag,
        obj_in: Union[TagUpdate, Dict[str, Any]]
    ) -> Tag:
        """Update a tag with duplicate check"""
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)
        
        if "name" in update_data:
            # Check for duplicate
            if existing_tag := self.check_duplicate(
                db,
                name=update_data["name"],
                organization_id=db_obj.organization_id,
                exclude_id=db_obj.id
            ):
                raise HTTPException(
                    status_code=400,
                    detail=f"A tag with name '{update_data['name']}' already exists in your organization"
                )
        
        return super().update(db=db, db_obj=db_obj, obj_in=obj_in)

    def delete(self, db: Session, *, tag_id: int) -> Tag:
        obj = db.query(Tag).get(tag_id)
        db.delete(obj)
        db.commit()
        return obj

    def get_by_name(self, db: Session, *, name: str) -> Optional[Tag]:
        return db.query(Tag).filter(Tag.name == name).first()

    def get_lead_tags(self, db: Session, lead_id: int) -> List[Tag]:
        return (
            db.query(Tag)
            .join(Tag.leads)
            .filter(Tag.leads.any(id=lead_id))
            .all()
        )

tag = CRUDTag(Tag)

__all__ = ["tag"]
