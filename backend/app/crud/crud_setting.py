from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.setting import Setting
from app.schemas.setting import SettingCreate, SettingUpdate, SystemSettings, OrganizationSettings, UserSettings, SettingType

class CRUDSetting(CRUDBase[Setting, SettingCreate, SettingUpdate]):
    def get_settings_by_type(
        self,
        db: Session,
        *,
        type: SettingType,
        organization_id: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get settings by type and optional organization/user ID
        """
        query = db.query(Setting).filter(Setting.type == type)
        
        if organization_id is not None:
            query = query.filter(Setting.organization_id == organization_id)
        if user_id is not None:
            query = query.filter(Setting.user_id == user_id)
            
        settings = query.all()
        return {setting.key: setting.value for setting in settings}

    def update_settings_by_type(
        self,
        db: Session,
        *,
        type: SettingType,
        settings_in: Union[SystemSettings, OrganizationSettings, UserSettings],
        organization_id: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Update settings by type and optional organization/user ID
        """
        settings_dict = settings_in.dict()
        
        for key, value in settings_dict.items():
            setting = db.query(Setting).filter(
                Setting.type == type,
                Setting.key == key,
                Setting.organization_id == organization_id if organization_id else Setting.organization_id.is_(None),
                Setting.user_id == user_id if user_id else Setting.user_id.is_(None)
            ).first()
            
            if setting:
                setting.value = str(value)
            else:
                db.add(Setting(
                    key=key,
                    value=str(value),
                    type=type,
                    organization_id=organization_id,
                    user_id=user_id
                ))
        
        db.commit()
        return self.get_settings_by_type(
            db,
            type=type,
            organization_id=organization_id,
            user_id=user_id
        )

    def get_system_settings(
        self,
        db: Session
    ) -> SystemSettings:
        """
        Get system settings
        """
        settings = self.get_settings_by_type(db, type=SettingType.SYSTEM)
        return SystemSettings(**settings)

    def update_system_settings(
        self,
        db: Session,
        *,
        settings_in: SystemSettings
    ) -> SystemSettings:
        """
        Update system settings
        """
        settings = self.update_settings_by_type(
            db,
            type=SettingType.SYSTEM,
            settings_in=settings_in
        )
        return SystemSettings(**settings)

    def get_organization_settings(
        self,
        db: Session,
        *,
        organization_id: int
    ) -> OrganizationSettings:
        """
        Get organization settings
        """
        settings = self.get_settings_by_type(
            db,
            type=SettingType.ORGANIZATION,
            organization_id=organization_id
        )
        return OrganizationSettings(**settings)

    def update_organization_settings(
        self,
        db: Session,
        *,
        organization_id: int,
        settings_in: OrganizationSettings
    ) -> OrganizationSettings:
        """
        Update organization settings
        """
        settings = self.update_settings_by_type(
            db,
            type=SettingType.ORGANIZATION,
            settings_in=settings_in,
            organization_id=organization_id
        )
        return OrganizationSettings(**settings)

    def get_user_settings(
        self,
        db: Session,
        *,
        user_id: int
    ) -> UserSettings:
        """
        Get user settings
        """
        settings = self.get_settings_by_type(
            db,
            type=SettingType.USER,
            user_id=user_id
        )
        return UserSettings(**settings)

    def update_user_settings(
        self,
        db: Session,
        *,
        user_id: int,
        settings_in: UserSettings
    ) -> UserSettings:
        """
        Update user settings
        """
        settings = self.update_settings_by_type(
            db,
            type=SettingType.USER,
            settings_in=settings_in,
            user_id=user_id
        )
        return UserSettings(**settings)

setting = CRUDSetting(Setting)
