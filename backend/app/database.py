from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create database URL
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Create engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=settings.MYSQL_POOL_SIZE,
    max_overflow=settings.MYSQL_MAX_OVERFLOW,
    pool_timeout=settings.MYSQL_POOL_TIMEOUT,
    pool_pre_ping=True,
    pool_recycle=1800
)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base model
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import all models to ensure they are registered
    from app.models import (
        user,
        organization,
        role,
        lead,
        task,
        note,
        event,
        deal,
        tag,
        linkedin
    )
    # Create all tables
    Base.metadata.create_all(bind=engine)

def drop_db():
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
