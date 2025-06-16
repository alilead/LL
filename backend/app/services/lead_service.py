from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.lead import Lead
from app.models.user import User
from app.services.token_service import TokenService
from app.core.constants import PUBLIC_FIELDS, PURCHASABLE_FIELDS, PRICES
from app.services.crystal_service import CrystalService
from app.schemas.lead import LeadCreate, LeadUpdate
from datetime import datetime
from sqlalchemy import or_, and_

class LeadService:
    def __init__(self, db: Session):
        self.db = db
        self.token_service = TokenService()
        self.crystal_service = CrystalService()

    @staticmethod
    def create_lead(db: Session, lead_data: LeadCreate, user: User) -> Lead:
        db_lead = Lead(
            **lead_data.dict(),
            organization_id=user.organization_id,
            created_by=user.id,
            user_id=user.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        return db_lead

    async def get_lead_data(
        self,
        lead_id: int,
        user_id: int,
        include_purchased: bool = True
    ) -> Dict[str, Any]:
        """Lead verilerini getir"""
        
        # Lead'i kontrol et
        lead = self.db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
            
        # Admin kontrolü
        user = self.db.query(User).filter(User.id == user_id).first()
        if user.is_admin:
            return lead.__dict__
            
        # Public alanları ekle
        result = {
            field: getattr(lead, field)
            for field in PUBLIC_FIELDS['lead']
        }
        
        if not include_purchased:
            return result
            
        # Satın alınan verileri ekle
        for data_type, fields in PURCHASABLE_FIELDS.items():
            has_access = await self.token_service.check_data_access(
                self.db, user_id, lead_id, data_type
            )
            
            if has_access:
                for field in fields:
                    if hasattr(lead, field):
                        result[field] = getattr(lead, field)
                        
        return result

    async def purchase_lead_data(
        self,
        lead_id: int,
        user_id: int,
        data_type: str
    ) -> Dict[str, Any]:
        """Lead verisi satın al"""
        
        # Lead'i kontrol et
        lead = self.db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
            
        # Veri tipini kontrol et
        if data_type not in PURCHASABLE_FIELDS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data type: {data_type}"
            )
            
        # Token kontrolü ve düşme
        await self.token_service.check_and_deduct_tokens(
            self.db, user_id, data_type
        )
        
        # Veriyi getir
        result = {}
        
        if data_type == 'psychometric_data':
            # Crystal API'den veriyi çek
            crystal_data = await self.crystal_service.get_personality_data(
                lead.email
            )
            
            # Lead'i güncelle
            for key, value in crystal_data.items():
                setattr(lead, key, value)
            
            result = crystal_data
        else:
            # Diğer veri tipleri için ilgili alanları getir
            result = {
                field: getattr(lead, field)
                for field in PURCHASABLE_FIELDS[data_type]
                if hasattr(lead, field)
            }
            
        self.db.commit()
        return result

    async def purchase_specific_data(
        self,
        lead_id: int,
        user_id: int,
        data_type: str
    ) -> Dict[str, Any]:
        """Belirli bir veri tipini satın al"""
        
        # Lead'i kontrol et
        lead = self.db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
            
        # Veri tipini kontrol et
        if data_type not in PRICES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data type: {data_type}"
            )
            
        # Satın alma durumunu kontrol et
        purchased_field = f"{data_type}_purchased"
        if hasattr(lead, purchased_field) and getattr(lead, purchased_field):
            raise HTTPException(
                status_code=400,
                detail=f"This {data_type} data has already been purchased"
            )
            
        # Token kontrolü ve düşme
        await self.token_service.check_and_deduct_tokens(
            self.db, user_id, data_type
        )
        
        # Satın alma işaretini güncelle
        setattr(lead, purchased_field, True)
        
        # Veriyi getir
        if data_type == 'psychometric_data':
            # Crystal API'den veriyi çek
            crystal_data = await self.crystal_service.get_personality_data(
                lead.email
            )
            
            # Lead'i güncelle
            for key, value in crystal_data.items():
                if hasattr(lead, key):
                    setattr(lead, key, value)
            
            result = crystal_data
        else:
            # Diğer veri tipleri için ilgili alanları getir
            result = {
                field: getattr(lead, field)
                for field in PURCHASABLE_FIELDS[data_type]
                if hasattr(lead, field)
            }
            
        self.db.commit()
        return result

    async def get_purchased_data_types(
        self,
        lead_id: int,
        user_id: int
    ) -> list:
        """Satın alınan veri tiplerini getir"""
        return await self.token_service.get_purchase_history(
            self.db, user_id, lead_id
        )

    @staticmethod
    def get_leads(
        db: Session,
        user: User,
        skip: int = 0,
        limit: int = 200,
        search: Optional[str] = None,
        sector: Optional[str] = None,
        country: Optional[str] = None,
        min_wpi: Optional[float] = None,
        max_wpi: Optional[float] = None
    ) -> List[Lead]:
        # Base query - get leads from user's organization
        query = db.query(Lead).filter(Lead.organization_id == user.organization_id)

        # Apply filters
        if search:
            query = query.filter(
                (Lead.first_name.ilike(f"%{search}%")) |
                (Lead.last_name.ilike(f"%{search}%")) |
                (Lead.company.ilike(f"%{search}%"))
            )
        
        if sector:
            query = query.filter(Lead.sector == sector)
            
        if country:
            query = query.filter(Lead.country == country)
            
        if min_wpi is not None:
            query = query.filter(Lead.wpi >= min_wpi)
            
        if max_wpi is not None:
            query = query.filter(Lead.wpi <= max_wpi)

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_lead(db: Session, lead_id: int, user: User) -> Optional[Lead]:
        return db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.organization_id == user.organization_id
        ).first()

    @staticmethod
    def update_lead(db: Session, lead_id: int, lead_data: LeadUpdate, user: User) -> Optional[Lead]:
        lead = db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.organization_id == user.organization_id
        ).first()
        
        if not lead:
            return None

        for field, value in lead_data.dict(exclude_unset=True).items():
            setattr(lead, field, value)

        lead.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(lead)
        return lead

    @staticmethod
    def delete_lead(db: Session, lead_id: int, user: User) -> bool:
        lead = db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.organization_id == user.organization_id
        ).first()
        
        if not lead:
            return False

        db.delete(lead)
        db.commit()
        return True