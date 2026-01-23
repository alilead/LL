from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.user import User
from app.models.lead import Lead
from app.core.logger import logger

class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def import_leads(self, csv_content: str) -> Dict[str, Any]:
        """Import leads from CSV file"""
        try:
            # Removed CSVImporter related code
            return {}
        except Exception as e:
            logger.error(f"Error importing leads: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error importing leads: {str(e)}"
            )

    def get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        try:
            total_users = self.db.query(func.count(User.id)).scalar()
            total_leads = self.db.query(func.count(Lead.id)).scalar()
            active_users = self.db.query(func.count(User.id)).filter(
                User.is_active == True
            ).scalar()

            return {
                "total_users": total_users,
                "total_leads": total_leads,
                "active_users": active_users
            }
        except Exception as e:
            logger.error(f"Error getting system stats: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error getting system stats: {str(e)}"
            )

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        """Get user statistics"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            lead_count = self.db.query(func.count(Lead.id)).filter(
                Lead.user_id == user_id
            ).scalar()

            return {
                "lead_count": lead_count,
                "last_login": user.last_login,
                "is_active": user.is_active
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting user stats: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error getting user stats: {str(e)}"
            )

    def get_revenue_stats(self, days: int = 30) -> Dict[str, Any]:
        """Get revenue statistics"""
        try:
            # Removed Payment related code
            return {}
        except Exception as e:
            logger.error(f"Error getting revenue stats: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error getting revenue stats: {str(e)}"
            )