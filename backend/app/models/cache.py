from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.db.base_class import Base

class Cache(Base):
    __tablename__ = "cache"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, nullable=False, index=True)
    value = Column(JSON)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, server_default="CURRENT_TIMESTAMP")
