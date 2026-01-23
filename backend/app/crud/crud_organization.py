from typing import Any, Dict, Optional, Union, List, Tuple, Type
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.crud.base import CRUDBase
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from datetime import datetime

class CRUDOrganization(CRUDBase[Organization, OrganizationCreate, OrganizationUpdate]):
    def __init__(self, model: Type[Organization]):
        super().__init__(model)

    def get_by_name(self, db: Session, *, name: str) -> Optional[Organization]:
        return db.query(Organization).filter(Organization.name == name).first()

    def create(self, db: Session, *, obj_in: Union[OrganizationCreate, Dict[str, Any]]) -> Organization:
        if isinstance(obj_in, dict):
            # Convert dict to OrganizationCreate and filter fields
            create_data = OrganizationCreate(**{
                k: v for k, v in obj_in.items() 
                if k in ["name", "description", "website", "is_active", 
                        "logo_filename", "logo_content_type", "logo_path"]
            })
        else:
            create_data = obj_in

        # Create organization object with current timestamp
        now = datetime.utcnow()
        db_obj = Organization(
            name=create_data.name,
            description=create_data.description,
            website=create_data.website,
            is_active=create_data.is_active,
            logo_filename=create_data.logo_filename,
            logo_content_type=create_data.logo_content_type,
            logo_path=create_data.logo_path,
            created_at=now,
            updated_at=now
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: Organization,
        obj_in: Union[OrganizationUpdate, Dict[str, Any]]
    ) -> Organization:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Organization]:
        query = db.query(Organization)
        
        if filters:
            for field, value in filters.items():
                if value is not None:
                    if field == "is_active":
                        query = query.filter(Organization.is_active == value)
                    elif field == "name":
                        query = query.filter(Organization.name.ilike(f"%{value}%"))
                    else:
                        query = query.filter(getattr(Organization, field) == value)
        
        return query.offset(skip).limit(limit).all()

    def get_multi_with_pagination(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Organization], int]:
        query = db.query(Organization)
        
        if filters:
            for field, value in filters.items():
                if value is not None:
                    if field == "is_active":
                        query = query.filter(Organization.is_active == value)
                    elif field == "name":
                        query = query.filter(Organization.name.ilike(f"%{value}%"))
                    else:
                        query = query.filter(getattr(Organization, field) == value)
        
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        
        return items, total

organization = CRUDOrganization(Organization)