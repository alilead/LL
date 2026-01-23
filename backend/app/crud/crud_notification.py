from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate

class CRUDNotification(CRUDBase[Notification, NotificationCreate, NotificationUpdate]):
    def get_user_notifications(
        self,
        db: Session,
        *,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        unread_only: bool = False
    ) -> List[Notification]:
        query = db.query(self.model).filter(self.model.user_id == user_id)
        if unread_only:
            query = query.filter(self.model.is_read == False)
        return query.order_by(self.model.created_at.desc()).offset(skip).limit(limit).all()

    def mark_as_read(
        self,
        db: Session,
        *,
        notification_id: int,
        user_id: int
    ) -> Optional[Notification]:
        notification = db.query(self.model).filter(
            self.model.id == notification_id,
            self.model.user_id == user_id
        ).first()
        if notification:
            notification.is_read = True
            db.add(notification)
            db.commit()
            db.refresh(notification)
        return notification

    def mark_all_as_read(
        self,
        db: Session,
        *,
        user_id: int
    ) -> bool:
        db.query(self.model).filter(
            self.model.user_id == user_id,
            self.model.is_read == False
        ).update({"is_read": True})
        db.commit()
        return True

notification = CRUDNotification(Notification)
