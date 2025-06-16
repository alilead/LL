from datetime import datetime
from typing import List
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class APIToken(Base):
    __tablename__ = "api_tokens"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    token = Column(String(512), unique=True, nullable=False, index=True)
    description = Column(Text)
    scopes = Column(JSON, nullable=False)  # List of allowed API scopes
    ip_whitelist = Column(JSON)  # List of allowed IP addresses
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime)
    last_used_at = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships using string references to avoid circular imports
    organization = relationship("Organization", back_populates="api_tokens")
    user = relationship("User", back_populates="api_tokens")
    usage_logs = relationship("APITokenUsage", back_populates="token", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<APIToken {self.name}>"

    @property
    def is_expired(self) -> bool:
        """Check if token is expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at

    @property
    def is_valid(self) -> bool:
        """Check if token is valid for use"""
        return self.is_active and not self.is_expired

    def has_scope(self, scope: str) -> bool:
        """Check if token has specific scope"""
        return scope in (self.scopes or [])

    def is_ip_allowed(self, ip_address: str) -> bool:
        """Check if IP address is allowed"""
        if not self.ip_whitelist:
            return True
        return ip_address in self.ip_whitelist


class APITokenUsage(Base):
    __tablename__ = "api_token_usage"

    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, ForeignKey("api_tokens.id", ondelete="CASCADE"), nullable=False)
    endpoint = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(String(255))
    status_code = Column(Integer, nullable=False)
    response_time = Column(Integer)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    token = relationship("APIToken", back_populates="usage_logs")
