from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class TeamInvitation(Base):
    __tablename__ = "team_invitations"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    role = Column(String(50), default="member")  # admin, member, viewer
    invitation_token = Column(String(255), nullable=False, unique=True)
    status = Column(String(20), default="pending")  # pending, accepted, expired, cancelled
    
    # Foreign keys
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    invited_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Additional fields
    message = Column(Text, nullable=True)  # Optional message from inviter
    expires_at = Column(DateTime, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships - comment out to avoid circular dependency
    # organization = relationship("Organization", back_populates="team_invitations")
    # invited_by = relationship("User", foreign_keys=[invited_by_id])
    
    def __repr__(self):
        return f"<TeamInvitation(email={self.email}, status={self.status})>" 