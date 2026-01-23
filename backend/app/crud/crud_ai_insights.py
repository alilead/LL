from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from app.crud.base import CRUDBase
from app.models.ai_insights import AIInsight
from app.schemas.ai_insights import AIInsightsResponse


class CRUDAIInsights(CRUDBase[AIInsight, dict, dict]):
    
    def get_by_lead_id(
        self, 
        db: Session, 
        *,
        lead_id: int,
        organization_id: int
    ) -> Optional[AIInsight]:
        """Lead ID'ye göre en son AI insight'ı getir"""
        return db.query(self.model).filter(
            and_(
                self.model.lead_id == lead_id,
                self.model.organization_id == organization_id
            )
        ).order_by(desc(self.model.created_at)).first()
    
    def get_by_lead_ids(
        self, 
        db: Session, 
        *,
        lead_ids: List[int],
        organization_id: int
    ) -> List[AIInsight]:
        """Birden fazla lead için AI insights getir"""
        
        # Her lead için en son insight'ı getirmek için subquery kullan
        from sqlalchemy import func
        
        subquery = db.query(
            self.model.lead_id,
            func.max(self.model.created_at).label('max_created_at')
        ).filter(
            and_(
                self.model.lead_id.in_(lead_ids),
                self.model.organization_id == organization_id
            )
        ).group_by(self.model.lead_id).subquery()
        
        return db.query(self.model).join(
            subquery,
            and_(
                self.model.lead_id == subquery.c.lead_id,
                self.model.created_at == subquery.c.max_created_at
            )
        ).all()
    
    def create_or_update(
        self,
        db: Session,
        *,
        lead_id: int,
        user_id: int,
        organization_id: int,
        analysis_data: Dict[str, Any]
    ) -> AIInsight:
        """AI insight oluştur veya güncelle"""
        
        # Mevcut insight var mı kontrol et
        existing = self.get_by_lead_id(
            db, 
            lead_id=lead_id, 
            organization_id=organization_id
        )
        
        # Prepare new analysis data
        ai_insight_data = {
            "lead_id": lead_id,
            "user_id": user_id,
            "organization_id": organization_id,
            "quality_score": analysis_data.get("quality_score", 0.0),
            "priority_score": analysis_data.get("priority_score", 0.0),
            "confidence_score": analysis_data.get("confidence", 0.0),
            "personality_type": analysis_data.get("personality_type"),
            "disc_profile": analysis_data.get("disc_profile"),
            "communication_style": analysis_data.get("communication_style"),
            "strengths": analysis_data.get("traits", []),
            "recommendations": {
                "sales_approach": analysis_data.get("sales_approach"),
                "provider": analysis_data.get("provider", "rule_based")
            },
            "sales_approach": analysis_data.get("sales_approach"),
            "features_used": analysis_data.get("features_used", 0),
            "ai_model_version": "1.0",
            "analysis_provider": analysis_data.get("provider", "rule_based")
        }
        
        if existing:
            # Güncelle
            for key, value in ai_insight_data.items():
                setattr(existing, key, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Yeni oluştur
            db_obj = self.model(**ai_insight_data)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
    
    def get_analytics(
        self,
        db: Session,
        *,
        organization_id: int,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """AI insights analytics getir"""
        
        query = db.query(self.model).filter(
            self.model.organization_id == organization_id
        )
        
        if limit:
            insights = query.order_by(desc(self.model.created_at)).limit(limit).all()
        else:
            insights = query.all()
        
        if not insights:
            return {
                "total_insights": 0,
                "avg_quality_score": 0,
                "avg_priority_score": 0,
                "avg_confidence": 0,
                "personality_distribution": {},
                "provider_distribution": {}
            }
        
        # Analytics hesapla
        total = len(insights)
        avg_quality = sum(i.quality_score for i in insights) / total
        avg_priority = sum(i.priority_score for i in insights) / total
        avg_confidence = sum(i.confidence_score for i in insights) / total
        
        # Personality type distribution
        personality_dist = {}
        for insight in insights:
            ptype = insight.personality_type or "Unknown"
            personality_dist[ptype] = personality_dist.get(ptype, 0) + 1
        
        # Provider dağılımı
        provider_dist = {}
        for insight in insights:
            provider = insight.analysis_provider or "unknown"
            provider_dist[provider] = provider_dist.get(provider, 0) + 1
        
        return {
            "total_insights": total,
            "avg_quality_score": round(avg_quality, 2),
            "avg_priority_score": round(avg_priority, 2),
            "avg_confidence": round(avg_confidence, 3),
            "personality_distribution": personality_dist,
            "provider_distribution": provider_dist
        }
    
    def get_high_priority_leads(
        self,
        db: Session,
        *,
        organization_id: int,
        min_priority_score: float = 70.0,
        limit: int = 10
    ) -> List[AIInsight]:
        """Get high priority leads"""
        
        return db.query(self.model).filter(
            and_(
                self.model.organization_id == organization_id,
                self.model.priority_score >= min_priority_score
            )
        ).order_by(desc(self.model.priority_score)).limit(limit).all()


ai_insights = CRUDAIInsights(AIInsight) 