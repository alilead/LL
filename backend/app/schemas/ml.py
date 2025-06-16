from pydantic import BaseModel
from typing import Dict, List, Any, Optional, Union

class LeadPredictionRequest(BaseModel):
    include_scoring: bool = True
    include_quality: bool = True
    include_priority: bool = True
    additional_features: Optional[Dict[str, Any]] = None

class PredictionResult(BaseModel):
    prediction: int
    probability: float
    confidence: float
    feature_importance: Dict[str, float]

class PredictionAlternative(BaseModel):
    value: str
    probability: float

class PersonalityPrediction(BaseModel):
    prediction: str
    probability: float
    alternatives: List[PredictionAlternative]

class LeadPredictionResponse(BaseModel):
    personality_type: PersonalityPrediction
    communication_style: PersonalityPrediction
    decision_making: PersonalityPrediction
    leadership_style: PersonalityPrediction
    motivation_factors: Optional[List[str]]
    work_preferences: Optional[List[str]]
    team_dynamics: Optional[str]
    strengths: Optional[List[str]]
    challenges: Optional[List[str]]
    recommendations: Optional[List[str]]

class BatchPredictionRequest(BaseModel):
    lead_ids: List[int]

class BatchPredictionResponse(BaseModel):
    message: str
    task_id: Optional[str]

class ModelMetric(BaseModel):
    version: str
    last_trained: str
    accuracy: float
    f1_score: float
    feature_count: int

class ModelMetrics(BaseModel):
    models: Dict[str, ModelMetric]

class ModelPerformanceMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1: float
    confusion_matrix: List[List[int]]

class ModelTrainingResult(BaseModel):
    status: str
    metrics: Dict[str, float]
    training_time: float
    model_version: str

class ModelRetrainingResponse(BaseModel):
    message: str
    task_id: Optional[str]

class PersonalityProfile(BaseModel):
    type: str
    strengths: List[str]
    communication_style: List[str]
    motivation_factors: List[str]
    decision_making: List[str]

class SalesRecommendations(BaseModel):
    approach: str
    tips: List[str]

class NegotiationStyle(BaseModel):
    primary_style: str
    strengths: List[str]
    challenges: List[str]
    recommendations: List[str]

class BuyingBehavior(BaseModel):
    style: str
    priorities: List[str]
    concerns: List[str]

class PsychometricInsights(BaseModel):
    personality_profile: PersonalityProfile
    sales_recommendations: SalesRecommendations
    communication_recommendations: List[str]
    negotiation_style: NegotiationStyle
    buying_behavior: BuyingBehavior

class CombinedRecommendations(BaseModel):
    approach: str
    communication_style: List[str]
    key_motivators: List[str]
    negotiation_tips: List[str]
    risk_factors: List[str]
    opportunity_score: float

class LeadInsightsResponse(BaseModel):
    lead_id: int
    ml_predictions: Dict[str, PredictionResult]
    psychometric_insights: PsychometricInsights
    combined_recommendations: CombinedRecommendations
