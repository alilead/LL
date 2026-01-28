from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from app.crud.base import CRUDBase
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageCreate, MessageUpdate
from app.core.encryption import encrypt_message_content, decrypt_message_content
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class CRUDMessage(CRUDBase[Message, MessageCreate, MessageUpdate]):
    
    def create_message(
        self, 
        db: Session, 
        *, 
        message_in: MessageCreate, 
        sender_id: int,
        organization_id: int
    ) -> Message:
        """Create a new message with encrypted content"""
        # Encrypt message content before storing
        original_content = message_in.content
        logger.info(f"Encrypting message: '{original_content}'")
        
        encrypted_content = encrypt_message_content(message_in.content)
        logger.info(f"Encrypted content: '{encrypted_content}' (length: {len(encrypted_content)})")
        
        db_obj = Message(
            content=encrypted_content,
            sender_id=sender_id,
            receiver_id=message_in.receiver_id,
            organization_id=organization_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        logger.info(f"Message saved to DB with content: '{db_obj.content}'")
        return db_obj
    
    def get_conversation(
        self,
        db: Session,
        *,
        user1_id: int,
        user2_id: int,
        organization_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Message]:
        """Get conversation between two users"""
        return (
            db.query(Message)
            .filter(
                and_(
                    Message.organization_id == organization_id,
                    or_(
                        and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
                        and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
                    )
                )
            )
            .order_by(Message.created_at)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_conversations_for_user(
        self,
        db: Session,
        *,
        user_id: int,
        organization_id: int
    ) -> List[tuple]:
        """Get all users that have conversations with the given user"""
        # Get unique conversation partners
        sent_to = (
            db.query(Message.receiver_id)
            .filter(
                and_(
                    Message.sender_id == user_id,
                    Message.organization_id == organization_id
                )
            )
            .distinct()
        )
        
        received_from = (
            db.query(Message.sender_id)
            .filter(
                and_(
                    Message.receiver_id == user_id,
                    Message.organization_id == organization_id
                )
            )
            .distinct()
        )
        
        # Combine and get user details
        partner_ids = sent_to.union(received_from).all()
        partner_ids = [pid[0] for pid in partner_ids]
        
        if not partner_ids:
            return []
            
        partners = (
            db.query(User)
            .filter(
                and_(
                    User.id.in_(partner_ids),
                    User.organization_id == organization_id,
                    User.is_active == True
                )
            )
            .all()
        )
        
        # Get last message and unread count for each partner
        conversations = []
        for partner in partners:
            last_message = (
                db.query(Message)
                .filter(
                    and_(
                        Message.organization_id == organization_id,
                        or_(
                            and_(Message.sender_id == user_id, Message.receiver_id == partner.id),
                            and_(Message.sender_id == partner.id, Message.receiver_id == user_id)
                        )
                    )
                )
                .order_by(desc(Message.created_at))
                .first()
            )
            
            unread_count = (
                db.query(Message)
                .filter(
                    and_(
                        Message.sender_id == partner.id,
                        Message.receiver_id == user_id,
                        Message.organization_id == organization_id,
                        Message.is_read == False
                    )
                )
                .count()
            )
            
            conversations.append((partner, last_message, unread_count))
        
        # Sort by last message time
        conversations.sort(
            key=lambda x: x[1].created_at if x[1] else datetime.min,
            reverse=True
        )
        
        return conversations
    
    def mark_as_read(
        self,
        db: Session,
        *,
        user_id: int,
        partner_id: int,
        organization_id: int
    ) -> int:
        """Mark all messages from partner as read"""
        count = (
            db.query(Message)
            .filter(
                and_(
                    Message.sender_id == partner_id,
                    Message.receiver_id == user_id,
                    Message.organization_id == organization_id,
                    Message.is_read == False
                )
            )
            .update({"is_read": True, "updated_at": datetime.utcnow()})
        )
        db.commit()
        return count
    
    def get_organization_users(
        self,
        db: Session,
        *,
        organization_id: int,
        current_user_id: int
    ) -> List[User]:
        """Get all active users in the organization except current user"""
        return (
            db.query(User)
            .filter(
                and_(
                    User.organization_id == organization_id,
                    User.id != current_user_id,
                    User.is_active == True
                )
            )
            .order_by(User.first_name, User.last_name)
            .all()
        )

message = CRUDMessage(Message) 