"""
Conversation Intelligence Models

Call recording, transcription, and AI analysis.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON, Float
from sqlalchemy.orm import relationship
from app.models.base import Base


class CallRecording(Base):
    """Call recording"""
    __tablename__ = "call_recordings"

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    lead_id = Column(Integer, ForeignKey("leads.id"))

    # Recording
    recording_url = Column(String(500))
    duration_seconds = Column(Integer)

    # Transcription
    transcript = Column(Text)
    transcription_status = Column(String(50), default="pending")

    # AI Analysis
    sentiment_score = Column(Float)  # -1 to 1
    keywords = Column(JSON)  # [{keyword, count, sentiment}]
    topics = Column(JSON)  # [topic1, topic2]
    action_items = Column(JSON)  # [{item, assignee}]

    # Moments
    key_moments = Column(JSON)  # [{timestamp, type, description}]
    competitor_mentions = Column(JSON)  # [{competitor, timestamp, context}]

    call_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    analyzed_at = Column(DateTime)


class ConversationInsight(Base):
    """AI-generated insights from conversations"""
    __tablename__ = "conversation_insights"

    id = Column(Integer, primary_key=True)
    recording_id = Column(Integer, ForeignKey("call_recordings.id"))

    insight_type = Column(String(50))  # objection, pain_point, buying_signal
    description = Column(Text)
    confidence_score = Column(Float)
    timestamp = Column(Integer)  # Seconds into call

    created_at = Column(DateTime, default=datetime.utcnow)
