"""
Legacy DB module kept for compatibility with older imports.

Use the canonical SQLAlchemy objects from app.db.base to avoid creating
additional connection pools in the same process.
"""
from app.db.base import engine, SessionLocal, Base

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
