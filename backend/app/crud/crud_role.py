from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models import Role, Permission
from app.schemas.role import RoleCreate, RoleUpdate

class CRUDRole(CRUDBase[Role, RoleCreate, RoleUpdate]):
    def get_by_name(self, db: Session, *, name: str, organization_id: int) -> Optional[Role]:
        return db.query(Role).filter(
            Role.name == name,
            Role.organization_id == organization_id
        ).first()

    def get_organization_roles(
        self,
        db: Session,
        organization_id: int,
        *,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Role]:
        query = db.query(Role).filter(Role.organization_id == organization_id)
        if is_active is not None:
            query = query.filter(Role.is_active == is_active)
        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: RoleCreate) -> Role:
        now = datetime.utcnow()
        db_obj = Role(
            name=obj_in.name,
            description=obj_in.description,
            is_active=obj_in.is_active,
            is_system=obj_in.is_system,
            organization_id=obj_in.organization_id,
            created_at=now,
            updated_at=now
        )

        # Add permissions if provided
        if obj_in.permission_ids:
            permissions = db.query(Permission).filter(
                Permission.id.in_(obj_in.permission_ids)
            ).all()
            db_obj.permissions = permissions

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: Role,
        obj_in: Union[RoleUpdate, Dict[str, Any]]
    ) -> Role:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        # Update permissions if provided
        if "permission_ids" in update_data:
            permission_ids = update_data.pop("permission_ids", [])
            if permission_ids:
                permissions = db.query(Permission).filter(
                    Permission.id.in_(permission_ids)
                ).all()
                db_obj.permissions = permissions
            else:
                db_obj.permissions = []

        update_data["updated_at"] = datetime.utcnow()
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def remove(self, db: Session, *, id: int) -> Role:
        obj = db.query(Role).get(id)
        if obj:
            # Clear permissions before deleting
            obj.permissions = []
            db.delete(obj)
            db.commit()
        return obj

role = CRUDRole(Role)
