from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
import secrets

from app.models.api_token import APIToken, APITokenUsage
from app.schemas.api_token import APITokenCreate, APITokenUpdate, APITokenUsageCreate


def generate_token() -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)


class APITokenCRUD:
    def get(self, db: Session, id: int) -> Optional[APIToken]:
        """Get token by ID"""
        return db.query(APIToken).filter(APIToken.id == id).first()

    def get_by_token(self, db: Session, token: str) -> Optional[APIToken]:
        """Get token by token string"""
        return db.query(APIToken).filter(APIToken.token == token).first()

    def get_multi(
        self,
        db: Session,
        organization_id: int,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get multiple tokens with filtering and pagination"""
        query = db.query(APIToken).filter(APIToken.organization_id == organization_id)

        if filters:
            if filters.get("name"):
                query = query.filter(
                    APIToken.name.ilike(f"%{filters['name']}%")
                )
            if filters.get("is_active") is not None:
                query = query.filter(APIToken.is_active == filters["is_active"])
            if filters.get("is_expired") is not None:
                if filters["is_expired"]:
                    query = query.filter(
                        APIToken.expires_at < datetime.utcnow()
                    )
                else:
                    query = query.filter(
                        or_(
                            APIToken.expires_at.is_(None),
                            APIToken.expires_at > datetime.utcnow()
                        )
                    )

        total = query.count()
        tokens = query.order_by(APIToken.created_at.desc()).offset(skip).limit(limit).all()

        return {
            "tokens": tokens,
            "total": total,
            "page": skip // limit + 1,
            "size": limit,
            "has_more": total > (skip + limit)
        }

    def create(
        self,
        db: Session,
        *,
        obj_in: APITokenCreate
    ) -> APIToken:
        """Create new API token"""
        obj_in_data = jsonable_encoder(obj_in)
        obj_in_data["token"] = generate_token()
        db_obj = APIToken(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: APIToken,
        obj_in: APITokenUpdate
    ) -> APIToken:
        """Update API token"""
        obj_data = jsonable_encoder(db_obj)
        update_data = obj_in.dict(exclude_unset=True)
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(
        self,
        db: Session,
        *,
        id: int
    ) -> APIToken:
        """Delete API token"""
        obj = db.query(APIToken).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def update_last_used(
        self,
        db: Session,
        *,
        token: APIToken
    ) -> APIToken:
        """Update last used timestamp"""
        token.last_used_at = datetime.utcnow()
        db.add(token)
        db.commit()
        db.refresh(token)
        return token

    def get_token_stats(
        self,
        db: Session,
        token_id: int,
        *,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get token usage statistics"""
        since = datetime.utcnow() - timedelta(days=days)
        
        # Base query for the token's usage logs
        query = db.query(APITokenUsage).filter(
            and_(
                APITokenUsage.token_id == token_id,
                APITokenUsage.created_at >= since
            )
        )

        # Total requests
        total_requests = query.count()

        # Success rate
        success_count = query.filter(
            APITokenUsage.status_code.between(200, 299)
        ).count()
        success_rate = (success_count / total_requests * 100) if total_requests > 0 else 0

        # Average response time
        avg_response_time = db.query(
            func.avg(APITokenUsage.response_time)
        ).filter(
            APITokenUsage.token_id == token_id
        ).scalar() or 0

        # Requests by endpoint
        requests_by_endpoint = dict(
            db.query(
                APITokenUsage.endpoint,
                func.count(APITokenUsage.id)
            ).filter(
                APITokenUsage.token_id == token_id
            ).group_by(
                APITokenUsage.endpoint
            ).all()
        )

        # Errors by status code
        errors_by_status = dict(
            db.query(
                APITokenUsage.status_code,
                func.count(APITokenUsage.id)
            ).filter(
                and_(
                    APITokenUsage.token_id == token_id,
                    APITokenUsage.status_code >= 400
                )
            ).group_by(
                APITokenUsage.status_code
            ).all()
        )

        # Usage by day
        usage_by_day = dict(
            db.query(
                func.date(APITokenUsage.created_at),
                func.count(APITokenUsage.id)
            ).filter(
                APITokenUsage.token_id == token_id
            ).group_by(
                func.date(APITokenUsage.created_at)
            ).all()
        )

        return {
            "total_requests": total_requests,
            "success_rate": round(success_rate, 2),
            "avg_response_time": round(float(avg_response_time), 2),
            "requests_by_endpoint": requests_by_endpoint,
            "errors_by_status": errors_by_status,
            "usage_by_day": {
                k.strftime("%Y-%m-%d"): v
                for k, v in usage_by_day.items()
            }
        }


class APITokenUsageCRUD:
    def create(
        self,
        db: Session,
        *,
        obj_in: APITokenUsageCreate
    ) -> APITokenUsage:
        """Create new usage log"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = APITokenUsage(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi(
        self,
        db: Session,
        token_id: int,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get usage logs with filtering and pagination"""
        query = db.query(APITokenUsage).filter(APITokenUsage.token_id == token_id)

        if filters:
            if filters.get("endpoint"):
                query = query.filter(
                    APITokenUsage.endpoint == filters["endpoint"]
                )
            if filters.get("method"):
                query = query.filter(
                    APITokenUsage.method == filters["method"]
                )
            if filters.get("status_code"):
                query = query.filter(
                    APITokenUsage.status_code == filters["status_code"]
                )
            if filters.get("ip_address"):
                query = query.filter(
                    APITokenUsage.ip_address == filters["ip_address"]
                )
            if filters.get("start_date"):
                query = query.filter(
                    APITokenUsage.created_at >= filters["start_date"]
                )
            if filters.get("end_date"):
                query = query.filter(
                    APITokenUsage.created_at <= filters["end_date"]
                )

        total = query.count()
        logs = query.order_by(APITokenUsage.created_at.desc()).offset(skip).limit(limit).all()

        return {
            "logs": logs,
            "total": total,
            "page": skip // limit + 1,
            "size": limit,
            "has_more": total > (skip + limit)
        }


api_token = APITokenCRUD()
api_token_usage = APITokenUsageCRUD()
