from typing import Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.lead import Lead
from app.core.logger import logger

class PsychometricService:
    def __init__(self, db: Session):
        self.db = db

    def get_psychometric_data(self, lead_id: int, user_id: int) -> Dict[str, Any]:
        """Get psychometric data for a lead"""
        # Get lead and verify ownership
        lead = self.db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        if lead.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this lead")
        
        # For now, return mock data
        return {
            "personality_type": "ENTJ",
            "traits": [
                "Strategic",
                "Decisive",
                "Efficient",
                "Ambitious"
            ],
            "communication_style": "Direct and goal-oriented",
            "work_preferences": [
                "Leadership roles",
                "Strategic planning",
                "Complex problem solving"
            ],
            "decision_making": "Logical and systematic",
            "team_dynamics": "Natural leader, prefers to take charge"
        }