from sqlalchemy import Boolean, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base
from datetime import datetime
from typing import Optional, Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.lead import Lead

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    
    # Lead Scoring
    quality_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    priority_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    
    # Personality Analysis
    personality_type: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    disc_profile: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    communication_style: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # AI Analysis Results (JSON)
    strengths: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    sales_approach: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Analysis Metadata
    features_used: Mapped[int] = mapped_column(Integer, default=0)
    ai_model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    analysis_provider: Mapped[str] = mapped_column(String(50), default="free_ai")  # "huggingface", "ollama", "rule_based"
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    lead: Mapped["Lead"] = relationship("Lead", back_populates="ai_insights")
    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<AIInsight lead_id={self.lead_id} quality={self.quality_score}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "lead_id": self.lead_id,
            "quality_score": self.quality_score,
            "priority_score": self.priority_score,
            "confidence_score": self.confidence_score,
            "personality_type": self.personality_type,
            "disc_profile": self.disc_profile,
            "communication_style": self.communication_style,
            "strengths": self.strengths,
            "recommendations": self.recommendations,
            "sales_approach": self.sales_approach,
            "features_used": self.features_used,
            "ai_model_version": self.ai_model_version,
            "analysis_provider": self.analysis_provider,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        } 