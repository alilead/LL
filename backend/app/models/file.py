from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, BigInteger
from sqlalchemy.orm import relationship

from app.models.base import Base

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size = Column(BigInteger, nullable=False)
    path = Column(String(512), nullable=False)
    entity_type = Column(
        Enum('lead', 'deal', 'task', 'note', 'communication', name='file_entity_type'),
        nullable=False
    )
    entity_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="files")
    user = relationship("User", back_populates="files")

    def __repr__(self):
        return f"<File {self.name}>"

    @property
    def download_url(self) -> str:
        """Generate download URL for the file"""
        return f"/api/v1/files/{self.id}/download"

    @property
    def preview_url(self) -> str:
        """Generate preview URL for the file if supported"""
        preview_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
        if self.mime_type in preview_types:
            return f"/api/v1/files/{self.id}/preview"
        return None

    @property
    def is_image(self) -> bool:
        """Check if file is an image"""
        return self.mime_type.startswith('image/')
