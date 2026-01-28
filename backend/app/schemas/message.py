from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    receiver_id: int

class MessageUpdate(BaseModel):
    is_read: Optional[bool] = None

class MessageInDB(MessageBase):
    id: int
    sender_id: int
    receiver_id: int
    organization_id: int
    is_read: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Message(MessageInDB):
    pass

class MessageWithSender(Message):
    sender_name: str
    sender_email: str

class MessageWithReceiver(Message):
    receiver_name: str
    receiver_email: str

class MessageFull(Message):
    sender_name: str
    sender_email: str
    receiver_name: str
    receiver_email: str

# Conversation schemas
class ConversationUser(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    is_active: bool

class ConversationSummary(BaseModel):
    user: ConversationUser
    last_message: Optional[Message] = None
    unread_count: int

class ConversationMessages(BaseModel):
    user: ConversationUser
    messages: List[MessageFull]
    total_count: int 