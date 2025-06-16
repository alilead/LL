from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.crud.base import CRUDBase
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate

class CRUDNote(CRUDBase[Note, NoteCreate, NoteUpdate]):
    def get_by_lead(self, db: Session, *, lead_id: int) -> List[Note]:
        return db.query(Note).filter(Note.lead_id == lead_id).all()

    def get_by_user(self, db: Session, *, user_id: int) -> List[Note]:
        return db.query(Note).filter(Note.created_by_id == user_id).all()

    def get(self, db: Session, note_id: int) -> Optional[Note]:
        return db.query(Note).filter(Note.id == note_id).first()

    def get_multi(
        self,
        db: Session,
        *,
        filters: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "created_at",
        sort_desc: bool = True
    ) -> List[Note]:
        query = db.query(Note)

        if filters:
            if created_by_id := filters.get("created_by_id"):
                query = query.filter(Note.created_by_id == created_by_id)
            if organization_id := filters.get("organization_id"):
                query = query.filter(Note.organization_id == organization_id)
            if lead_id := filters.get("lead_id"):
                query = query.filter(Note.lead_id == lead_id)
            if deal_id := filters.get("deal_id"):
                query = query.filter(Note.deal_id == deal_id)

        # Apply sorting
        if hasattr(Note, sort_by):
            order_by = desc(getattr(Note, sort_by)) if sort_desc else asc(getattr(Note, sort_by))
            query = query.order_by(order_by)

        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: NoteCreate) -> Note:
        note = Note(
            content=obj_in.content,
            lead_id=obj_in.lead_id,
            organization_id=obj_in.organization_id,
            created_by_id=obj_in.created_by_id,
            deal_id=obj_in.deal_id
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return note

    def update(self, db: Session, *, db_obj: Note, obj_in: NoteUpdate) -> Note:
        update_data = obj_in.model_dump(exclude_unset=True)
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def remove(self, db: Session, *, id: int) -> Note:
        return super().remove(db, id=id)

    def count(self, db: Session, filters: Optional[Dict[str, Any]] = None) -> int:
        query = db.query(Note)
        
        if filters:
            if created_by_id := filters.get("created_by_id"):
                query = query.filter(Note.created_by_id == created_by_id)
            if organization_id := filters.get("organization_id"):
                query = query.filter(Note.organization_id == organization_id)
            if lead_id := filters.get("lead_id"):
                query = query.filter(Note.lead_id == lead_id)
            if deal_id := filters.get("deal_id"):
                query = query.filter(Note.deal_id == deal_id)
        
        return query.count()

note = CRUDNote(Note)

__all__ = ["note"]
