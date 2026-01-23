from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User
from app.models.organization import Organization
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash
from datetime import datetime

class UserService:
    @staticmethod
    async def create_user(db: Session, user_data: UserCreate) -> User:
        # Check if organization exists with the company name
        organization = db.query(Organization).filter(
            Organization.name == user_data.company
        ).first()

        # If organization doesn't exist, create it
        if not organization:
            organization = Organization(
                name=user_data.company,
                description=f"Organization for {user_data.company}"
            )
            db.add(organization)
            db.flush()

        # Create user with organization
        db_user = User(
            organization_id=organization.id,
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            company=user_data.company,  # Keep for backwards compatibility
            job_title=user_data.job_title,
            is_active=True,
            is_superuser=False,
            is_admin=user_data.is_admin,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    async def update_user(db: Session, user_id: int, user_data: UserUpdate) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # If company is being updated, update or create organization
        if user_data.company and user_data.company != user.company:
            organization = db.query(Organization).filter(
                Organization.name == user_data.company
            ).first()

            if not organization:
                organization = Organization(
                    name=user_data.company,
                    description=f"Organization for {user_data.company}"
                )
                db.add(organization)
                db.flush()

            user.organization_id = organization.id

        # Update user fields
        for field, value in user_data.dict(exclude_unset=True).items():
            if field == "password":
                setattr(user, "password_hash", get_password_hash(value))
            else:
                setattr(user, field, value)

        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_organization_users(db: Session, organization_id: int):
        """Get all users in the same organization"""
        return db.query(User).filter(User.organization_id == organization_id).all()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        db.delete(user)
        db.commit()
        return True
