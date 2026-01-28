"""
CRUD operations for Conversation Intelligence
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime

from app.models.conversation import CallRecording, ConversationInsight
from app.schemas.conversation import (
    CallRecordingCreate, CallRecordingUpdate,
    ConversationInsightCreate
)


class CRUDCallRecording:
    """CRUD operations for Call Recording"""

    def get(self, db: Session, recording_id: int) -> Optional[CallRecording]:
        """Get call recording by ID"""
        return db.query(CallRecording).filter(CallRecording.id == recording_id).first()

    def get_multi(
        self,
        db: Session,
        *,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        lead_id: Optional[int] = None,
        transcription_status: Optional[str] = None
    ) -> List[CallRecording]:
        """Get multiple call recordings"""
        query = db.query(CallRecording).filter(
            CallRecording.organization_id == organization_id
        )

        if user_id:
            query = query.filter(CallRecording.user_id == user_id)

        if lead_id:
            query = query.filter(CallRecording.lead_id == lead_id)

        if transcription_status:
            query = query.filter(CallRecording.transcription_status == transcription_status)

        return query.order_by(CallRecording.call_date.desc()).offset(skip).limit(limit).all()

    def search(
        self,
        db: Session,
        *,
        organization_id: int,
        query_text: Optional[str] = None,
        user_id: Optional[int] = None,
        lead_id: Optional[int] = None,
        min_sentiment: Optional[float] = None,
        max_sentiment: Optional[float] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        topics: Optional[List[str]] = None
    ) -> List[CallRecording]:
        """Search call recordings"""
        query = db.query(CallRecording).filter(
            CallRecording.organization_id == organization_id
        )

        if query_text:
            search_term = f"%{query_text}%"
            query = query.filter(CallRecording.transcript.ilike(search_term))

        if user_id:
            query = query.filter(CallRecording.user_id == user_id)

        if lead_id:
            query = query.filter(CallRecording.lead_id == lead_id)

        if min_sentiment is not None:
            query = query.filter(CallRecording.sentiment_score >= min_sentiment)

        if max_sentiment is not None:
            query = query.filter(CallRecording.sentiment_score <= max_sentiment)

        if date_from:
            query = query.filter(CallRecording.call_date >= date_from)

        if date_to:
            query = query.filter(CallRecording.call_date <= date_to)

        # TODO: Implement topic filtering with JSON operations
        # if topics:
        #     query = query.filter(CallRecording.topics.contains(topics))

        return query.order_by(CallRecording.call_date.desc()).all()

    def create(
        self,
        db: Session,
        *,
        obj_in: CallRecordingCreate,
        organization_id: int
    ) -> CallRecording:
        """Create new call recording"""
        recording = CallRecording(
            **obj_in.model_dump(),
            organization_id=organization_id,
            transcription_status="pending"
        )
        db.add(recording)
        db.commit()
        db.refresh(recording)
        return recording

    def update(
        self,
        db: Session,
        *,
        recording: CallRecording,
        obj_in: CallRecordingUpdate
    ) -> CallRecording:
        """Update call recording"""
        update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(recording, field, value)

        db.add(recording)
        db.commit()
        db.refresh(recording)
        return recording

    def update_transcription(
        self,
        db: Session,
        *,
        recording: CallRecording,
        transcript: str,
        status: str = "completed"
    ) -> CallRecording:
        """Update recording with transcription"""
        recording.transcript = transcript
        recording.transcription_status = status

        db.add(recording)
        db.commit()
        db.refresh(recording)
        return recording

    def update_analysis(
        self,
        db: Session,
        *,
        recording: CallRecording,
        sentiment_score: Optional[float] = None,
        keywords: Optional[List[Dict[str, Any]]] = None,
        topics: Optional[List[str]] = None,
        action_items: Optional[List[Dict[str, Any]]] = None,
        key_moments: Optional[List[Dict[str, Any]]] = None,
        competitor_mentions: Optional[List[Dict[str, Any]]] = None
    ) -> CallRecording:
        """Update recording with AI analysis results"""
        if sentiment_score is not None:
            recording.sentiment_score = sentiment_score

        if keywords is not None:
            recording.keywords = keywords

        if topics is not None:
            recording.topics = topics

        if action_items is not None:
            recording.action_items = action_items

        if key_moments is not None:
            recording.key_moments = key_moments

        if competitor_mentions is not None:
            recording.competitor_mentions = competitor_mentions

        recording.analyzed_at = datetime.utcnow()

        db.add(recording)
        db.commit()
        db.refresh(recording)
        return recording

    def delete(self, db: Session, *, recording_id: int) -> bool:
        """Delete call recording"""
        recording = self.get(db, recording_id)
        if recording:
            db.delete(recording)
            db.commit()
            return True
        return False

    def get_analytics(
        self,
        db: Session,
        *,
        organization_id: int,
        user_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get call analytics"""
        query = db.query(CallRecording).filter(
            CallRecording.organization_id == organization_id
        )

        if user_id:
            query = query.filter(CallRecording.user_id == user_id)

        if date_from:
            query = query.filter(CallRecording.call_date >= date_from)

        if date_to:
            query = query.filter(CallRecording.call_date <= date_to)

        recordings = query.all()

        # Calculate metrics
        total_calls = len(recordings)
        total_duration = sum(r.duration_seconds for r in recordings)
        avg_duration = total_duration / total_calls if total_calls > 0 else 0

        sentiment_scores = [r.sentiment_score for r in recordings if r.sentiment_score is not None]
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0

        transcribed_count = sum(1 for r in recordings if r.transcription_status == "completed")
        analyzed_count = sum(1 for r in recordings if r.analyzed_at is not None)

        # Aggregate keywords
        keyword_counts = {}
        for recording in recordings:
            if recording.keywords:
                for kw in recording.keywords:
                    keyword = kw.get("keyword", "")
                    keyword_counts[keyword] = keyword_counts.get(keyword, 0) + kw.get("count", 1)

        common_keywords = [
            {"keyword": k, "count": v}
            for k, v in sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]

        # Aggregate topics
        topic_counts = {}
        for recording in recordings:
            if recording.topics:
                for topic in recording.topics:
                    topic_counts[topic] = topic_counts.get(topic, 0) + 1

        common_topics = sorted(topic_counts.keys(), key=lambda x: topic_counts[x], reverse=True)[:10]

        return {
            "total_calls": total_calls,
            "total_duration_minutes": total_duration // 60,
            "avg_duration_minutes": round(avg_duration / 60, 1),
            "avg_sentiment_score": round(avg_sentiment, 2),
            "transcribed_count": transcribed_count,
            "analyzed_count": analyzed_count,
            "common_keywords": common_keywords,
            "common_topics": common_topics
        }

    def get_competitor_summary(
        self,
        db: Session,
        *,
        organization_id: int,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get competitor mention summary"""
        query = db.query(CallRecording).filter(
            and_(
                CallRecording.organization_id == organization_id,
                CallRecording.competitor_mentions.isnot(None)
            )
        )

        if date_from:
            query = query.filter(CallRecording.call_date >= date_from)

        if date_to:
            query = query.filter(CallRecording.call_date <= date_to)

        recordings = query.all()

        # Aggregate competitor mentions
        competitor_data = {}
        for recording in recordings:
            if recording.competitor_mentions:
                for mention in recording.competitor_mentions:
                    competitor = mention.get("competitor", "Unknown")
                    if competitor not in competitor_data:
                        competitor_data[competitor] = {
                            "competitor": competitor,
                            "mention_count": 0,
                            "context_summary": [],
                            "sentiments": []
                        }

                    competitor_data[competitor]["mention_count"] += 1
                    competitor_data[competitor]["context_summary"].append(mention.get("context", ""))

                    if mention.get("sentiment") is not None:
                        competitor_data[competitor]["sentiments"].append(mention["sentiment"])

        # Calculate averages and format
        result = []
        for comp, data in competitor_data.items():
            avg_sentiment = None
            if data["sentiments"]:
                avg_sentiment = sum(data["sentiments"]) / len(data["sentiments"])

            result.append({
                "competitor": comp,
                "mention_count": data["mention_count"],
                "context_summary": data["context_summary"][:5],  # Top 5 contexts
                "avg_sentiment": round(avg_sentiment, 2) if avg_sentiment is not None else None
            })

        # Sort by mention count
        result.sort(key=lambda x: x["mention_count"], reverse=True)

        return result


class CRUDConversationInsight:
    """CRUD operations for Conversation Insights"""

    def get(self, db: Session, insight_id: int) -> Optional[ConversationInsight]:
        """Get insight by ID"""
        return db.query(ConversationInsight).filter(
            ConversationInsight.id == insight_id
        ).first()

    def get_by_recording(
        self,
        db: Session,
        recording_id: int,
        insight_type: Optional[str] = None
    ) -> List[ConversationInsight]:
        """Get insights for a recording"""
        query = db.query(ConversationInsight).filter(
            ConversationInsight.recording_id == recording_id
        )

        if insight_type:
            query = query.filter(ConversationInsight.insight_type == insight_type)

        return query.order_by(ConversationInsight.timestamp).all()

    def create(
        self,
        db: Session,
        *,
        obj_in: ConversationInsightCreate
    ) -> ConversationInsight:
        """Create new insight"""
        insight = ConversationInsight(**obj_in.model_dump())
        db.add(insight)
        db.commit()
        db.refresh(insight)
        return insight

    def bulk_create(
        self,
        db: Session,
        *,
        recording_id: int,
        insights: List[ConversationInsightCreate]
    ) -> List[ConversationInsight]:
        """Create multiple insights"""
        created_insights = []

        for insight_data in insights:
            insight = ConversationInsight(**insight_data.model_dump())
            db.add(insight)
            created_insights.append(insight)

        db.commit()

        for insight in created_insights:
            db.refresh(insight)

        return created_insights

    def delete(self, db: Session, *, insight_id: int) -> bool:
        """Delete insight"""
        insight = self.get(db, insight_id)
        if insight:
            db.delete(insight)
            db.commit()
            return True
        return False


# Create instances
crud_call_recording = CRUDCallRecording()
crud_conversation_insight = CRUDConversationInsight()
