from typing import Any, Dict, Optional, Union, List
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.models.email_log import EmailLog  # Import EmailLog model
from app.models.communication import Communication  # Import Communication model
import logging
import time

logger = logging.getLogger(__name__)

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get(self, db: Session, *, id: int) -> Optional[User]:
        return super().get(db, id=id)

    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_multi_base(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[User]:
        """Base get_multi method from CRUDBase"""
        return super().get_multi(db, skip=skip, limit=limit)

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
        is_admin: Optional[bool] = None,
        organization_id: Optional[int] = None,
    ) -> List[User]:
        query = db.query(self.model)
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        if is_admin is not None:
            query = query.filter(User.is_admin == is_admin)
        if organization_id is not None:
            query = query.filter(User.organization_id == organization_id)
        return query.offset(skip).limit(limit).all()

    def get_organization_users(
        self,
        db: Session,
        organization_id: int
    ) -> List[User]:
        """
        Get all active users in an organization.
        """
        return (
            db.query(User)
            .filter(
                User.organization_id == organization_id,
                User.is_active == True
            )
            .order_by(User.first_name)
            .all()
        )

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        now = datetime.utcnow()
        db_obj = User(
            organization_id=obj_in.organization_id,
            email=obj_in.email,
            password_hash=get_password_hash(obj_in.password),
            first_name=obj_in.first_name,
            last_name=obj_in.last_name,
            company=obj_in.company,
            job_title=obj_in.job_title,
            is_active=obj_in.is_active,
            is_superuser=obj_in.is_superuser,
            is_admin=obj_in.is_admin,
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
        db_obj: User,
        obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        if update_data.get("password"):
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["password_hash"] = hashed_password
        update_data["updated_at"] = datetime.utcnow()
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[User]:
        try:
            logger.info(f"Attempting authentication for email: {email}")
            user = self.get_by_email(db, email=email)
            if not user:
                logger.warning(f"User not found: {email}")
                return None
            
            if not verify_password(password, user.password_hash):
                logger.warning(f"Invalid password for user: {email}")
                return None
                
            # Update last_login
            try:
                user.last_login = datetime.utcnow()
                db.commit()
                logger.info(f"Successfully authenticated user: {email}")
                return user
            except Exception as e:
                logger.error(f"Error updating last_login: {str(e)}")
                db.rollback()
                raise
                
        except Exception as e:
            logger.error(f"Authentication error for {email}: {str(e)}")
            db.rollback()
            raise

    def is_active(self, user: User) -> bool:
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        return user.is_superuser

    def is_admin(self, user: User) -> bool:
        return user.is_admin

    def remove(self, db: Session, *, id: int) -> Optional[User]:
        """
        Deactivate user instead of deleting.
        """
        user = db.query(User).filter(User.id == id).first()
        if not user:
            return None

        try:
            # Set user as inactive
            user.is_active = False
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            db.rollback()
            raise e

user = CRUDUser(User)

__all__ = ["user"]
