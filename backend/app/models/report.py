from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from app.schemas.report import ReportType, ReportFormat
from datetime import datetime

class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    report_type = Column(SQLEnum(ReportType), nullable=False)
    report_format = Column(SQLEnum(ReportFormat), nullable=False)
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    filters = Column(JSON, nullable=True)
    schedule = Column(JSON, nullable=True)
    result_url = Column(String(1000), nullable=True)
    error_message = Column(String(1000), nullable=True)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)

    # Foreign Keys
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships - comment out to avoid circular dependency
    # organization = relationship("Organization", back_populates="reports")
    # user = relationship("User", back_populates="reports")

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Report {self.name}>"
