from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base, TimestampMixin

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    priority = Column(Enum(TaskPriority), nullable=False)
    status = Column(Enum(TaskStatus), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Foreign Keys
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)

    # Relationships
    assigned_to = relationship("User", back_populates="tasks")
    organization = relationship("Organization", back_populates="tasks")
    lead = relationship("Lead", back_populates="tasks")

    def __repr__(self):
        return f"<Task {self.title}>"
