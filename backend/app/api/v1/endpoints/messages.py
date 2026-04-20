from typing import List
import os
import re
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api import deps
from app.crud.crud_message import message
from app.models.user import User
from app.models.message import Message as MessageModel
from app.core.config import settings
from app.core.encryption import decrypt_message_content
from app.schemas.message import (
    MessageCreate, 
    MessageFull, 
    ConversationSummary, 
    ConversationMessages,
    ConversationUser
)

router = APIRouter()


def _safe_filename(name: str) -> str:
    base = os.path.basename(name or "file")
    cleaned = re.sub(r"[^a-zA-Z0-9._-]", "_", base)
    return (cleaned[:200] or "file")


def create_message_response(msg, sender_name: str, sender_email: str, receiver_name: str, receiver_email: str) -> MessageFull:
    """Create MessageFull response with decrypted content"""
    return MessageFull(
        id=msg.id,
        content=decrypt_message_content(msg.content),  # Decrypt for API response
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        organization_id=msg.organization_id,
        is_read=msg.is_read,
        created_at=msg.created_at,
        updated_at=msg.updated_at,
        sender_name=sender_name,
        sender_email=sender_email,
        receiver_name=receiver_name,
        receiver_email=receiver_email
    )

@router.get("/conversations", response_model=List[ConversationSummary])
def get_conversations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get all conversations for current user"""
    conversations_data = message.get_conversations_for_user(
        db=db, 
        user_id=current_user.id, 
        organization_id=current_user.organization_id
    )
    
    conversations = []
    for partner, last_message, unread_count in conversations_data:
        conversation_user = ConversationUser(
            id=partner.id,
            first_name=partner.first_name,
            last_name=partner.last_name,
            email=partner.email,
            is_active=partner.is_active
        )
        
        last_msg = None
        if last_message:
            sender_name = partner.full_name if last_message.sender_id == partner.id else current_user.full_name
            sender_email = partner.email if last_message.sender_id == partner.id else current_user.email
            receiver_name = current_user.full_name if last_message.receiver_id == current_user.id else partner.full_name
            receiver_email = current_user.email if last_message.receiver_id == current_user.id else partner.email
            
            last_msg = create_message_response(
                last_message, sender_name, sender_email, receiver_name, receiver_email
            )
        
        conversations.append(ConversationSummary(
            user=conversation_user,
            last_message=last_msg,
            unread_count=unread_count
        ))
    
    return conversations

@router.get("/conversation/{partner_id}", response_model=ConversationMessages)
def get_conversation(
    partner_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get conversation with a specific user"""
    # Get partner user
    partner = db.query(User).filter(
        User.id == partner_id,
        User.organization_id == current_user.organization_id,
        User.is_active == True
    ).first()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or not in same organization"
        )
    
    # Get messages
    messages_data = message.get_conversation(
        db=db,
        user1_id=current_user.id,
        user2_id=partner_id,
        organization_id=current_user.organization_id,
        skip=skip,
        limit=limit
    )
    
    # Convert to response format with decrypted content
    formatted_messages = []
    for msg in messages_data:  # Keep newest last (newest messages at bottom)
        sender = current_user if msg.sender_id == current_user.id else partner
        receiver = partner if msg.receiver_id == partner.id else current_user
        
        formatted_messages.append(create_message_response(
            msg, sender.full_name, sender.email, receiver.full_name, receiver.email
        ))
    
    conversation_user = ConversationUser(
        id=partner.id,
        first_name=partner.first_name,
        last_name=partner.last_name,
        email=partner.email,
        is_active=partner.is_active
    )
    
    return ConversationMessages(
        user=conversation_user,
        messages=formatted_messages,
        total_count=len(formatted_messages)
    )

@router.post("/send", response_model=MessageFull)
def send_message(
    message_data: MessageCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Send a message to another user"""
    # Verify receiver exists and is in same organization
    receiver = db.query(User).filter(
        User.id == message_data.receiver_id,
        User.organization_id == current_user.organization_id,
        User.is_active == True
    ).first()
    
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found or not in same organization"
        )
    
    # Create message
    new_message = message.create_message(
        db=db,
        message_in=message_data,
        sender_id=current_user.id,
        organization_id=current_user.organization_id
    )
    
    return create_message_response(
        new_message, 
        current_user.full_name, 
        current_user.email, 
        receiver.full_name, 
        receiver.email
    )


@router.post("/send-attachment", response_model=MessageFull)
async def send_message_with_attachment(
    receiver_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Send a message with a file attachment (stored under UPLOAD_DIR; content references filename)."""
    receiver = db.query(User).filter(
        User.id == receiver_id,
        User.organization_id == current_user.organization_id,
        User.is_active == True,
    ).first()

    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found or not in same organization",
        )

    raw = await file.read()
    if len(raw) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds maximum upload size",
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}_{_safe_filename(file.filename)}"
    path = os.path.join(settings.UPLOAD_DIR, stored_name)
    with open(path, "wb") as fh:
        fh.write(raw)

    text = f"[Attachment: {file.filename}] ({len(raw)} bytes). Stored as {stored_name}."
    new_message = message.create_message(
        db=db,
        message_in=MessageCreate(content=text, receiver_id=receiver_id),
        sender_id=current_user.id,
        organization_id=current_user.organization_id,
    )

    return create_message_response(
        new_message,
        current_user.full_name,
        current_user.email,
        receiver.full_name,
        receiver.email,
    )


@router.post("/mark-read/{partner_id}")
def mark_messages_as_read(
    partner_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Mark all messages from a user as read"""
    # Verify partner exists and is in same organization
    partner = db.query(User).filter(
        User.id == partner_id,
        User.organization_id == current_user.organization_id,
        User.is_active == True
    ).first()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or not in same organization"
        )
    
    count = message.mark_as_read(
        db=db,
        user_id=current_user.id,
        partner_id=partner_id,
        organization_id=current_user.organization_id
    )
    
    return {"marked_count": count}


@router.get("/attachments/{stored_name}")
def download_attachment(
    stored_name: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Download a message attachment by stored filename, only if user is a participant.
    """
    attachment_pattern = f"Stored as {stored_name}"
    candidate_messages = db.query(MessageModel).filter(
        MessageModel.organization_id == current_user.organization_id,
        ((MessageModel.sender_id == current_user.id) | (MessageModel.receiver_id == current_user.id))
    ).all()

    allowed = any(attachment_pattern in decrypt_message_content(msg.content) for msg in candidate_messages)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment file not found")

    return FileResponse(path=file_path, filename=stored_name, media_type="application/octet-stream")

@router.get("/users", response_model=List[ConversationUser])
def get_organization_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get all users in the organization for starting new conversations"""
    users = message.get_organization_users(
        db=db,
        organization_id=current_user.organization_id,
        current_user_id=current_user.id
    )
    
    return [
        ConversationUser(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            is_active=user.is_active
        )
        for user in users
    ] 