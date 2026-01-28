from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
import secrets
import string

from app.crud.base import CRUDBase
from app.models.team_invitation import TeamInvitation
from app.models.user import User
from app.models.organization import Organization
from app.schemas.team_invitation import TeamInvitationCreate, TeamInvitationUpdate

class CRUDTeamInvitation(CRUDBase[TeamInvitation, TeamInvitationCreate, TeamInvitationUpdate]):
    
    def generate_invitation_token(self) -> str:
        """Generate a secure random token for invitations"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(32))
    
    def create_invitation(
        self, 
        db: Session, 
        *, 
        invitation_data: TeamInvitationCreate,
        organization_id: int,
        invited_by_id: int,
        expires_in_hours: int = 72
    ) -> TeamInvitation:
        """Create a new team invitation"""
        # Check if user already exists
        existing_user = db.query(User).filter(
            and_(
                User.email == invitation_data.email,
                User.organization_id == organization_id
            )
        ).first()
        
        if existing_user:
            raise ValueError("User with this email already exists in the organization")
        
        # Check for existing pending invitation
        existing_invitation = db.query(TeamInvitation).filter(
            and_(
                TeamInvitation.email == invitation_data.email,
                TeamInvitation.organization_id == organization_id,
                TeamInvitation.status == "pending",
                TeamInvitation.expires_at > datetime.utcnow()
            )
        ).first()
        
        if existing_invitation:
            raise ValueError("A pending invitation already exists for this email")
        
        # Generate invitation token
        invitation_token = self.generate_invitation_token()
        
        # Calculate expiration time
        expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
        
        # Create invitation
        db_invitation = TeamInvitation(
            email=invitation_data.email,
            first_name=invitation_data.first_name,
            last_name=invitation_data.last_name,
            role=invitation_data.role,
            message=invitation_data.message,
            invitation_token=invitation_token,
            status="pending",
            organization_id=organization_id,
            invited_by_id=invited_by_id,
            expires_at=expires_at
        )
        
        db.add(db_invitation)
        db.commit()
        db.refresh(db_invitation)
        return db_invitation
    
    def get_by_token(self, db: Session, *, token: str) -> Optional[TeamInvitation]:
        """Get invitation by token"""
        return db.query(TeamInvitation).filter(
            TeamInvitation.invitation_token == token
        ).first()
    
    def get_organization_invitations(
        self, 
        db: Session, 
        *, 
        organization_id: int,
        status: Optional[str] = None
    ) -> List[TeamInvitation]:
        """Get all invitations for an organization"""
        query = db.query(TeamInvitation).filter(
            TeamInvitation.organization_id == organization_id
        )
        
        if status:
            query = query.filter(TeamInvitation.status == status)
        
        return query.order_by(TeamInvitation.created_at.desc()).all()
    
    def get_user_invitations(
        self, 
        db: Session, 
        *, 
        email: str,
        status: Optional[str] = None
    ) -> List[TeamInvitation]:
        """Get all invitations for a specific email"""
        query = db.query(TeamInvitation).filter(
            TeamInvitation.email == email
        )
        
        if status:
            query = query.filter(TeamInvitation.status == status)
        
        return query.order_by(TeamInvitation.created_at.desc()).all()
    
    def accept_invitation(
        self, 
        db: Session, 
        *, 
        invitation: TeamInvitation
    ) -> TeamInvitation:
        """Mark invitation as accepted"""
        invitation.status = "accepted"
        invitation.accepted_at = datetime.utcnow()
        db.commit()
        db.refresh(invitation)
        return invitation
    
    def cancel_invitation(
        self, 
        db: Session, 
        *, 
        invitation: TeamInvitation
    ) -> TeamInvitation:
        """Cancel a pending invitation"""
        if invitation.status != "pending":
            raise ValueError("Only pending invitations can be cancelled")
        
        invitation.status = "cancelled"
        db.commit()
        db.refresh(invitation)
        return invitation
    
    def resend_invitation(
        self, 
        db: Session, 
        *, 
        invitation: TeamInvitation,
        expires_in_hours: int = 72
    ) -> TeamInvitation:
        """Resend an invitation by updating its token and expiration"""
        if invitation.status not in ["pending", "expired"]:
            raise ValueError("Only pending or expired invitations can be resent")
        
        # Generate new token
        invitation.invitation_token = self.generate_invitation_token()
        invitation.status = "pending"
        invitation.expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
        
        db.commit()
        db.refresh(invitation)
        return invitation
    
    def expire_old_invitations(self, db: Session) -> int:
        """Mark expired invitations as expired"""
        expired_invitations = db.query(TeamInvitation).filter(
            and_(
                TeamInvitation.status == "pending",
                TeamInvitation.expires_at < datetime.utcnow()
            )
        ).all()
        
        count = 0
        for invitation in expired_invitations:
            invitation.status = "expired"
            count += 1
        
        if count > 0:
            db.commit()
        
        return count
    
    def get_invitation_stats(self, db: Session, *, organization_id: int) -> dict:
        """Get invitation statistics for an organization"""
        total = db.query(TeamInvitation).filter(
            TeamInvitation.organization_id == organization_id
        ).count()
        
        pending = db.query(TeamInvitation).filter(
            and_(
                TeamInvitation.organization_id == organization_id,
                TeamInvitation.status == "pending"
            )
        ).count()
        
        accepted = db.query(TeamInvitation).filter(
            and_(
                TeamInvitation.organization_id == organization_id,
                TeamInvitation.status == "accepted"
            )
        ).count()
        
        expired = db.query(TeamInvitation).filter(
            and_(
                TeamInvitation.organization_id == organization_id,
                TeamInvitation.status == "expired"
            )
        ).count()
        
        return {
            "total": total,
            "pending": pending,
            "accepted": accepted,
            "expired": expired,
            "cancelled": total - pending - accepted - expired
        }

team_invitation = CRUDTeamInvitation(TeamInvitation) 