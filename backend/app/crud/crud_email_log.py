from typing import Optional, List
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.email_log import EmailLog
from app.schemas.email_log import EmailLogCreate, EmailLogUpdate


class CRUDEmailLog(CRUDBase[EmailLog, EmailLogCreate, EmailLogUpdate]):
    def get_by_email(
        self, db: Session, *, email: str, skip: int = 0, limit: int = 100
    ) -> List[EmailLog]:
        return (
            db.query(self.model)
            .filter(EmailLog.recipient_email == email)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_failed_emails(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[EmailLog]:
        return (
            db.query(self.model)
            .filter(EmailLog.is_sent == False)
            .offset(skip)
            .limit(limit)
            .all()
        )


email_log = CRUDEmailLog(EmailLog)