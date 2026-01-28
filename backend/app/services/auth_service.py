from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.models.user import User
from app.models.organization import Organization
from app.core.config import settings
from app.schemas.user import UserCreate
from app.core.logger import logger

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, user_data: UserCreate) -> Dict[str, Any]:
        # Check if user exists
        if self.db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Check or create organization
        organization = self.db.query(Organization).filter(
            Organization.name == user_data.company
        ).first()

        if not organization:
            organization = Organization(
                name=user_data.company,
                description=f"Organization for {user_data.company}"
            )
            self.db.add(organization)
            self.db.flush()

        # Create user with hashed password
        hashed_password = pwd_context.hash(user_data.password)
        db_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            company=user_data.company,
            organization_id=organization.id,
            job_title=user_data.job_title,
            is_active=True,
            is_superuser=False,
            is_admin=user_data.is_admin,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        # Generate tokens
        access_token = self.create_access_token(
            data={
                "sub": str(db_user.id),
                "org": str(organization.id)
            }
        )
        refresh_token = self.create_refresh_token(
            data={
                "sub": str(db_user.id),
                "org": str(organization.id)
            }
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": db_user.id,
                "email": db_user.email,
                "first_name": db_user.first_name,
                "last_name": db_user.last_name,
                "company": db_user.company,
                "organization_id": db_user.organization_id,
                "is_admin": db_user.is_admin
            }
        }

    def login(self, email: str, password: str) -> Dict[str, Any]:
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not pwd_context.verify(password, user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password"
            )

        # Generate tokens with organization info
        access_token = self.create_access_token(
            data={
                "sub": str(user.id),
                "org": str(user.organization_id)
            }
        )
        refresh_token = self.create_refresh_token(
            data={
                "sub": str(user.id),
                "org": str(user.organization_id)
            }
        )

        # Update last login
        user.last_login = datetime.utcnow()
        self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "company": user.company,
                "organization_id": user.organization_id,
                "is_admin": user.is_admin
            }
        }

    def create_access_token(self, data: Dict[str, Any]) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def verify_token(self, token: str) -> Dict[str, Any]:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = int(payload.get("sub"))
            org_id = int(payload.get("org"))
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid token")
            return {"user_id": user_id, "organization_id": org_id}
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    def get_current_user(self, token: str) -> User:
        token_data = self.verify_token(token)
        user = self.db.query(User).filter(User.id == token_data["user_id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user