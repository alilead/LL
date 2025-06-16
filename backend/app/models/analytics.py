from sqlalchemy import Column, DateTime, String, func, JSON, ForeignKey, Integer, Float, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base

class AuditMixin:
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String(50))
    updated_by = Column(String(50))

class Base(declarative_base()):
    __abstract__ = True
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String(50))
    updated_by = Column(String(50))

class SystemAudit(Base, AuditMixin):
    __tablename__ = "system_audits"
    
    id = Column(Integer, primary_key=True)
    action = Column(String(50), nullable=False)
    table_name = Column(String(50), nullable=False)
    record_id = Column(Integer)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(String(255))

class LeadAnalytics(Base):
    __tablename__ = "lead_analytics"
    
    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey("leads.lead_id"))
    engagement_history = Column(JSON)
    psychometric_data = Column(JSON)
    communication_preferences = Column(JSON)
    lead_score = Column(Float)
    last_analyzed = Column(DateTime)

class UserAnalytics(Base):
    __tablename__ = "user_analytics"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    usage_metrics = Column(JSON)
    subscription_history = Column(JSON)
    api_usage = Column(JSON)
    last_active = Column(DateTime)

class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    properties = Column(JSON)
    timestamp = Column(DateTime, nullable=False)
    user_id = Column(String(50))
    session_id = Column(String(50), nullable=False)
    
    # Frontend'den gelen metrikler
    page_load_time = Column(Float)
    time_to_interactive = Column(Float)
    first_contentful_paint = Column(Float)
    largest_contentful_paint = Column(Float)
    cumulative_layout_shift = Column(Float)
    first_input_delay = Column(Float)
    
    # İşlemsel metrikler
    api_response_time = Column(Float)
    api_status_code = Column(Integer)
    api_endpoint = Column(String(255))
    
    # Kullanıcı etkileşimi metrikleri
    interaction_type = Column(String(50))
    interaction_target = Column(String(255))
    interaction_duration = Column(Float)
    
    # Cihaz ve ortam bilgileri
    user_agent = Column(String(255))
    screen_resolution = Column(String(50))
    viewport_size = Column(String(50))
    connection_type = Column(String(50))
    
    # Hata izleme
    error_name = Column(String(255))
    error_message = Column(Text)
    error_stack = Column(Text)
    error_context = Column(JSON)

class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    user_id = Column(String(50))
    session_id = Column(String(50), nullable=False)
    labels = Column(JSON)
    
    # Metrik kategorisi
    category = Column(String(50), nullable=False)  # web_vitals, resource, api, render, interaction
    
    # Sayfa ve bileşen bilgisi
    page_url = Column(String(255))
    component_name = Column(String(100))
    
    # Resource metrikleri için
    resource_type = Column(String(50))
    resource_url = Column(String(255))
    resource_size = Column(Integer)
    
    # API metrikleri için
    api_endpoint = Column(String(255))
    api_method = Column(String(10))
    status_code = Column(Integer)
    
    # Render metrikleri için
    render_phase = Column(String(50))  # mount, update, unmount
    render_duration = Column(Float)
    
    # İnteraktif metrikler için
    interaction_type = Column(String(50))
    interaction_target = Column(String(255))
    interaction_outcome = Column(String(50))

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String(50), nullable=False, unique=True)
    user_id = Column(String(50))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    duration = Column(Float)
    
    # Oturum bilgileri
    pages_viewed = Column(Integer, default=0)
    interactions_count = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    api_calls_count = Column(Integer, default=0)
    
    # Performans özeti
    avg_page_load_time = Column(Float)
    avg_api_response_time = Column(Float)
    total_error_count = Column(Integer)
    
    # Cihaz ve ortam bilgileri
    user_agent = Column(String(255))
    ip_address = Column(String(45))
    country = Column(String(2))
    city = Column(String(100))
    device_type = Column(String(50))
    browser = Column(String(50))
    os = Column(String(50))
    
    # Oturum özellikleri
    is_bounce = Column(Boolean, default=False)
    conversion_count = Column(Integer, default=0)
    engagement_score = Column(Float)
    session_value = Column(Float)