from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.user_settings import UserSettings
from app.schemas.user_settings import UserSettingsCreate, UserSettingsUpdate

class CRUDUserSettings(CRUDBase[UserSettings, UserSettingsCreate, UserSettingsUpdate]):
    def get_by_user(self, db: Session, *, user_id: int) -> Optional[UserSettings]:
        """Get settings for a specific user"""
        return db.query(UserSettings).filter(UserSettings.user_id == user_id).first()

    def create_with_user(
        self,
        db: Session,
        *,
        obj_in: UserSettingsCreate
    ) -> UserSettings:
        """Create settings for a user"""
        db_obj = UserSettings(
            user_id=obj_in.user_id,
            theme_preference=obj_in.theme_preference.dict() if obj_in.theme_preference else None,
            notification_preferences=obj_in.notification_preferences.dict() if obj_in.notification_preferences else None,
            dashboard_layout=obj_in.dashboard_layout.dict() if obj_in.dashboard_layout else None,
            timezone=obj_in.timezone,
            language=obj_in.language
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_settings(
        self,
        db: Session,
        *,
        db_obj: UserSettings,
        obj_in: Union[UserSettingsUpdate, Dict[str, Any]]
    ) -> UserSettings:
        """Update user settings"""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        # Handle nested JSON fields
        if "theme_preference" in update_data and update_data["theme_preference"]:
            current_theme = db_obj.theme_preference or {}
            update_data["theme_preference"] = {**current_theme, **update_data["theme_preference"]}

        if "notification_preferences" in update_data and update_data["notification_preferences"]:
            current_notifications = db_obj.notification_preferences or {}
            update_data["notification_preferences"] = {**current_notifications, **update_data["notification_preferences"]}

        if "dashboard_layout" in update_data and update_data["dashboard_layout"]:
            current_layout = db_obj.dashboard_layout or {}
            update_data["dashboard_layout"] = {**current_layout, **update_data["dashboard_layout"]}

        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def get_or_create(
        self,
        db: Session,
        *,
        user_id: int
    ) -> UserSettings:
        """Get user settings or create if not exists"""
        settings = self.get_by_user(db, user_id=user_id)
        if not settings:
            settings = self.create_with_user(
                db,
                obj_in=UserSettingsCreate(user_id=user_id)
            )
        return settings


user_settings = CRUDUserSettings(UserSettings)
