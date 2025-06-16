from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime
from app.core.encryption import encrypt_message_content, decrypt_message_content

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)  # Encrypted content stored here
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Foreign Keys
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    organization = relationship("Organization", back_populates="messages")

    @property
    def decrypted_content(self) -> str:
        """Get decrypted message content"""
        return decrypt_message_content(self.content)
    
    def set_content(self, plain_content: str) -> None:
        """Set message content (will be encrypted automatically)"""
        self.content = encrypt_message_content(plain_content)
    
    def __repr__(self):
        return f"<Message {self.id} from {self.sender_id} to {self.receiver_id}>" 