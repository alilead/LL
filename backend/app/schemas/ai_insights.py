from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class LeadScoreResponse(BaseModel):
    quality: float = Field(..., description="Lead quality score (0-100)")
    priority: float = Field(..., description="Lead priority score (0-100)")
    confidence: float = Field(..., description="Confidence score (0-1)")

class PersonalityResponse(BaseModel):
    type: str = Field(..., description="DISC personality type")
    strengths: List[str] = Field(..., description="Strengths")
    communication: List[str] = Field(..., description="Communication style characteristics")
    confidence: float = Field(..., description="Personality prediction confidence score (0-1)")

class RecommendationsResponse(BaseModel):
    approach: str = Field(..., description="Recommended sales approach")
    tips: List[str] = Field(..., description="Sales tips")
    challenges: List[str] = Field(..., description="Points to consider")

class AIInsightsResponse(BaseModel):
    lead_id: int = Field(..., description="Lead ID")
    lead_score: LeadScoreResponse = Field(..., description="Lead scores")
    personality: PersonalityResponse = Field(..., description="Personality analysis")
    recommendations: RecommendationsResponse = Field(..., description="Sales recommendations")
    features_used: int = Field(..., description="Number of features used for analysis")
    confidence_score: float = Field(..., description="Overall confidence score (0-1)")
    
    class Config:
        json_schema_extra = {  # Pydantic v2: schema_extra → json_schema_extra
            "example": {
                "lead_id": 123,
                "lead_score": {
                    "quality": 85.5,
                    "priority": 92.0,
                    "confidence": 0.8
                },
                "personality": {
                    "type": "DISC",
                    "strengths": ["Leadership", "Quick decision making", "Results-oriented"],
                    "communication": ["Direct", "Results-focused", "Brief and concise"],
                    "confidence": 0.7
                },
                "recommendations": {
                    "approach": "Results-Oriented Sales",
                    "tips": [
                        "Make brief and concise presentations",
                        "Emphasize ROI and concrete benefits",
                        "Offer quick decision-making processes"
                    ],
                    "challenges": [
                        "Avoid wasting time",
                        "Highlight main points without going into too much detail"
                    ]
                },
                "features_used": 25,
                "confidence_score": 0.8
            }
        }

class BatchAnalysisRequest(BaseModel):
    lead_ids: List[int] = Field(..., description="Lead IDs to be analyzed", max_items=50)

class BatchAnalysisResult(BaseModel):
    lead_id: int
    quality_score: float
    priority_score: float
    confidence: float

class BatchAnalysisResponse(BaseModel):
    success: bool
    analyzed_count: int
    results: List[BatchAnalysisResult]

# For adding AI scores to lead listing
class LeadWithAIScores(BaseModel):
    id: int
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]
    company: Optional[str]
    job_title: Optional[str]
    
    # AI Scores
    ai_quality_score: Optional[float] = Field(None, description="AI quality score")
    ai_priority_score: Optional[float] = Field(None, description="AI priority score")
    ai_personality_type: Optional[str] = Field(None, description="Predicted personality type")
    ai_confidence: Optional[float] = Field(None, description="AI prediction confidence score")
    
    class Config:
        from_attributes = True 