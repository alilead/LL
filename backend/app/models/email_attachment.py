# app/models/email_attachment.py
from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary, BigInteger, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class EmailAttachment(Base, TimestampMixin):
    __tablename__ = "email_attachments"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=True)
    size_bytes = Column(BigInteger, nullable=False, default=0)  # Matches DB column name
    
    # File content (for small files) or path (for large files)
    content = Column(LargeBinary, nullable=True)  # For small files
    file_path = Column(String(500), nullable=True)  # For large files stored on disk
    
    # Flags
    is_inline = Column(Boolean, default=False)
    is_calendar_invite = Column(Boolean, default=False)  # Matches DB column
    
    # Foreign Keys
    email_id = Column(Integer, ForeignKey("emails.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    email = relationship("Email", back_populates="attachments")
    
    def __repr__(self):
        return f"<EmailAttachment(id={self.id}, filename='{self.filename}', size_bytes={self.size_bytes})>"
