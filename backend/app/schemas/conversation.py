"""
Conversation Intelligence Schemas

Pydantic schemas for call recording, transcription, and AI analysis.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, HttpUrl


# Call Recording Schemas
class CallRecordingBase(BaseModel):
    """Base call recording schema"""
    lead_id: int = Field(..., description="Associated lead ID")
    recording_url: str = Field(..., description="URL to call recording", max_length=500)
    duration_seconds: int = Field(..., description="Call duration in seconds", ge=0)
    call_date: datetime = Field(..., description="Date and time of call")


class CallRecordingCreate(CallRecordingBase):
    """Create call recording"""
    user_id: int = Field(..., description="User who made the call")


class CallRecordingUpdate(BaseModel):
    """Update call recording"""
    transcript: Optional[str] = None
    transcription_status: Optional[str] = Field(None, description="pending, processing, completed, failed")
    sentiment_score: Optional[float] = Field(None, ge=-1, le=1, description="Sentiment score from -1 to 1")
    keywords: Optional[List[Dict[str, Any]]] = None
    topics: Optional[List[str]] = None
    action_items: Optional[List[Dict[str, str]]] = None
    key_moments: Optional[List[Dict[str, Any]]] = None
    competitor_mentions: Optional[List[Dict[str, Any]]] = None


class CallRecordingResponse(CallRecordingBase):
    """Call recording response"""
    id: int
    organization_id: int
    user_id: int
    transcript: Optional[str] = None
    transcription_status: str
    sentiment_score: Optional[float] = None
    keywords: Optional[List[Dict[str, Any]]] = None
    topics: Optional[List[str]] = None
    action_items: Optional[List[Dict[str, Any]]] = None
    key_moments: Optional[List[Dict[str, Any]]] = None
    competitor_mentions: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    analyzed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Conversation Insight Schemas
class ConversationInsightBase(BaseModel):
    """Base conversation insight schema"""
    insight_type: str = Field(..., description="objection, pain_point, buying_signal, question, commitment")
    description: str = Field(..., description="Insight description")
    confidence_score: float = Field(..., description="Confidence score 0-1", ge=0, le=1)
    timestamp: int = Field(..., description="Seconds into call", ge=0)


class ConversationInsightCreate(ConversationInsightBase):
    """Create conversation insight"""
    recording_id: int = Field(..., description="Associated recording ID")


class ConversationInsightResponse(ConversationInsightBase):
    """Conversation insight response"""
    id: int
    recording_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Analysis Request/Response
class TranscriptionRequest(BaseModel):
    """Request call transcription"""
    recording_id: int = Field(..., description="Recording ID to transcribe")
    language: str = Field("en-US", description="Language code for transcription")


class AnalysisRequest(BaseModel):
    """Request AI analysis of call"""
    recording_id: int = Field(..., description="Recording ID to analyze")
    analyze_sentiment: bool = Field(True, description="Analyze sentiment")
    extract_keywords: bool = Field(True, description="Extract keywords")
    identify_topics: bool = Field(True, description="Identify topics")
    detect_action_items: bool = Field(True, description="Detect action items")
    find_key_moments: bool = Field(True, description="Find key moments")
    detect_competitors: bool = Field(True, description="Detect competitor mentions")


class AnalysisResult(BaseModel):
    """AI analysis result"""
    recording_id: int
    status: str = Field(..., description="completed, processing, failed")
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = Field(None, description="positive, neutral, negative")
    keywords: List[Dict[str, Any]] = []
    topics: List[str] = []
    action_items: List[Dict[str, Any]] = []
    key_moments: List[Dict[str, Any]] = []
    competitor_mentions: List[Dict[str, Any]] = []
    insights: List[ConversationInsightResponse] = []
    analyzed_at: datetime


# Analytics Schemas
class CallAnalytics(BaseModel):
    """Call analytics summary"""
    total_calls: int
    total_duration_minutes: int
    avg_duration_minutes: float
    avg_sentiment_score: float
    transcribed_count: int
    analyzed_count: int
    common_keywords: List[Dict[str, Any]] = []
    common_topics: List[str] = []
    common_objections: List[str] = []


class UserCallPerformance(BaseModel):
    """User call performance metrics"""
    user_id: int
    user_name: str
    total_calls: int
    avg_sentiment_score: float
    positive_calls_percent: float
    total_action_items: int
    total_insights: int


class CompetitorMentionSummary(BaseModel):
    """Competitor mention summary"""
    competitor: str
    mention_count: int
    context_summary: List[str] = []
    avg_sentiment: Optional[float] = None


# Search and Filter
class CallSearchRequest(BaseModel):
    """Search calls by criteria"""
    query: Optional[str] = Field(None, description="Search transcript content")
    user_id: Optional[int] = None
    lead_id: Optional[int] = None
    min_sentiment: Optional[float] = Field(None, ge=-1, le=1)
    max_sentiment: Optional[float] = Field(None, ge=-1, le=1)
    has_insights: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    topics: Optional[List[str]] = None


# Keyword Schema
class Keyword(BaseModel):
    """Extracted keyword"""
    keyword: str
    count: int
    sentiment: Optional[float] = None
    relevance_score: Optional[float] = None


# Key Moment Schema
class KeyMoment(BaseModel):
    """Key moment in call"""
    timestamp: int = Field(..., description="Seconds into call")
    type: str = Field(..., description="objection, buying_signal, question, commitment, pain_point")
    description: str
    confidence: float = Field(..., ge=0, le=1)


# Action Item Schema
class ActionItem(BaseModel):
    """Action item from call"""
    item: str = Field(..., description="Action item description")
    assignee: Optional[str] = Field(None, description="Who should handle it")
    priority: Optional[str] = Field(None, description="low, medium, high")
    due_date: Optional[datetime] = None


# Competitor Mention Schema
class CompetitorMention(BaseModel):
    """Competitor mention in call"""
    competitor: str
    timestamp: int = Field(..., description="Seconds into call")
    context: str = Field(..., description="Context of mention")
    sentiment: Optional[float] = Field(None, description="Sentiment about competitor")


# Coaching Insights
class CoachingInsight(BaseModel):
    """AI-generated coaching insight"""
    category: str = Field(..., description="talk_ratio, pace, filler_words, question_asking")
    description: str
    score: float = Field(..., ge=0, le=100, description="Performance score 0-100")
    recommendation: str
    examples: List[str] = []


class CoachingReport(BaseModel):
    """Coaching report for a user"""
    user_id: int
    user_name: str
    period_start: datetime
    period_end: datetime
    total_calls_analyzed: int
    insights: List[CoachingInsight]
    overall_score: float = Field(..., ge=0, le=100)
    strengths: List[str]
    areas_for_improvement: List[str]
