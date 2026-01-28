from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
import re

class CRUDOrganization(CRUDBase[Organization, OrganizationCreate, OrganizationUpdate]):
    def normalize_name(self, name: str) -> str:
        # Convert to lowercase
        name = name.lower()
        # Replace multiple spaces with single space
        name = re.sub(r'\s+', ' ', name)
        # Remove leading/trailing spaces
        name = name.strip()
        # Remove special characters except spaces and alphanumeric
        name = re.sub(r'[^a-z0-9\s]', '', name)
        return name

    def create_with_owner(self, db: Session, *, name: str) -> Organization:
        # Normalize the organization name
        normalized_name = self.normalize_name(name)
        
        # Check if organization already exists
        existing_org = self.get_by_name(db, name=normalized_name)
        if existing_org:
            # If exists, add a unique identifier
            base_name = normalized_name
            counter = 1
            while self.get_by_name(db, name=normalized_name):
                normalized_name = f"{base_name} {counter}"
                counter += 1

        db_obj = Organization(
            name=normalized_name,
            is_active=True,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_name(self, db: Session, *, name: str) -> Optional[Organization]:
        normalized_name = self.normalize_name(name)
        return db.query(Organization).filter(Organization.name == normalized_name).first()

organization = CRUDOrganization(Organization)
