from typing import Any, Dict, Optional, Union, List
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()
    
    def get_by_email_or_username(self, db: Session, *, identifier: str) -> Optional[User]:
        """Get user by email or username. Tries email first, then username."""
        # Try email first
        user = db.query(User).filter(User.email == identifier).first()
        if user:
            return user
        # Try username
        return db.query(User).filter(User.username == identifier).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        from datetime import datetime
        now = datetime.utcnow()
        
        db_obj = User(
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            first_name=obj_in.first_name,
            last_name=obj_in.last_name,
            organization_id=obj_in.organization_id,
            is_active=True,
            is_superuser=False,
            is_admin=False,
            created_at=now,
            updated_at=now
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, email: str = None, username: str = None, password: str) -> Optional[User]:
        """Authenticate user by email or username"""
        if email:
            user = self.get_by_email(db, email=email)
        elif username:
            user = self.get_by_username(db, username=username)
        else:
            return None
        
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        return user.is_superuser

    def get_multi_by_organization(
        self, db: Session, *, organization_id: int, skip: int = 0, limit: int = 100
    ) -> List[User]:
        return (
            db.query(User)
            .filter(User.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

user = CRUDUser(User)
