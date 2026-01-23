from sqlalchemy import Column, DateTime, String, func, Integer, Float, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

class AuditMixin:
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String(50))
    updated_by = Column(String(50))

class Base(declarative_base()):
    __abstract__ = True
    __table_args__ = {'mysql_engine': 'InnoDB'}

class SystemMetrics(Base):
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=func.now())
    cpu_usage = Column(Float)
    memory_usage = Column(Float)
    disk_usage = Column(Float)
    db_connections = Column(Integer)
    api_response_time = Column(Float)
    error_count = Column(Integer)
    
class SlowQueries(Base):
    __tablename__ = "slow_queries"
    
    id = Column(Integer, primary_key=True)
    query = Column(Text)
    execution_time = Column(Float)
    timestamp = Column(DateTime, default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))
    stack_trace = Column(Text) 