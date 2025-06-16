from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.email import EmailTemplate, EmailLog
from app.schemas.email import EmailTemplateCreate, EmailTemplateUpdate, EmailLogCreate


class EmailTemplateCRUD:
    def get(self, db: Session, id: int) -> Optional[EmailTemplate]:
        """Get template by ID"""
        return db.query(EmailTemplate).filter(EmailTemplate.id == id).first()

    def get_multi(
        self,
        db: Session,
        organization_id: int,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get multiple templates with filtering and pagination"""
        query = db.query(EmailTemplate).filter(
            EmailTemplate.organization_id == organization_id
        )

        if filters:
            if filters.get("name"):
                query = query.filter(
                    EmailTemplate.name.ilike(f"%{filters['name']}%")
                )
            if filters.get("is_active") is not None:
                query = query.filter(
                    EmailTemplate.is_active == filters["is_active"]
                )

        total = query.count()
        templates = query.order_by(EmailTemplate.created_at.desc()).offset(skip).limit(limit).all()

        return {
            "templates": templates,
            "total": total,
            "page": skip // limit + 1,
            "size": limit,
            "has_more": total > (skip + limit)
        }

    def create(
        self,
        db: Session,
        *,
        obj_in: EmailTemplateCreate
    ) -> EmailTemplate:
        """Create new email template"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = EmailTemplate(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: EmailTemplate,
        obj_in: EmailTemplateUpdate
    ) -> EmailTemplate:
        """Update email template"""
        obj_data = jsonable_encoder(db_obj)
        update_data = obj_in.dict(exclude_unset=True)
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(
        self,
        db: Session,
        *,
        id: int
    ) -> EmailTemplate:
        """Delete email template"""
        obj = db.query(EmailTemplate).get(id)
        db.delete(obj)
        db.commit()
        return obj


class EmailLogCRUD:
    def get(self, db: Session, id: int) -> Optional[EmailLog]:
        """Get email log by ID"""
        return db.query(EmailLog).filter(EmailLog.id == id).first()

    def get_multi(
        self,
        db: Session,
        organization_id: int,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get multiple email logs with filtering and pagination"""
        query = db.query(EmailLog).filter(EmailLog.organization_id == organization_id)

        if filters:
            if filters.get("status"):
                query = query.filter(EmailLog.status == filters["status"])
            if filters.get("to_email"):
                query = query.filter(
                    EmailLog.to_email.ilike(f"%{filters['to_email']}%")
                )
            if filters.get("template_id"):
                query = query.filter(
                    EmailLog.template_id == filters["template_id"]
                )
            if filters.get("start_date"):
                query = query.filter(
                    EmailLog.created_at >= filters["start_date"]
                )
            if filters.get("end_date"):
                query = query.filter(
                    EmailLog.created_at <= filters["end_date"]
                )

        total = query.count()
        logs = query.order_by(EmailLog.created_at.desc()).offset(skip).limit(limit).all()

        return {
            "logs": logs,
            "total": total,
            "page": skip // limit + 1,
            "size": limit,
            "has_more": total > (skip + limit)
        }

    def create(
        self,
        db: Session,
        *,
        obj_in: EmailLogCreate
    ) -> EmailLog:
        """Create new email log"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = EmailLog(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_status(
        self,
        db: Session,
        *,
        db_obj: EmailLog,
        status: str,
        error_message: Optional[str] = None
    ) -> EmailLog:
        """Update email log status"""
        db_obj.status = status
        if status == 'sent':
            db_obj.sent_at = datetime.utcnow()
        if error_message:
            db_obj.error_message = error_message
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


email_template = EmailTemplateCRUD()
email_log = EmailLogCRUD()
