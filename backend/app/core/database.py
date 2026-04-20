"""
Core DB compatibility module.

Re-export shared engine/session from app.db.base so the app maintains a
single SQLAlchemy pool instead of multiple independent pools.
"""
from app.db.base import engine, SessionLocal, Base

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
