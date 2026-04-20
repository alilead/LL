"""
Compatibility module.

Historically this file created its own SQLAlchemy engine/sessionmaker.
That caused multiple independent pools in the same process. Re-export the
canonical engine/session from app.db.base to keep a single shared pool.
"""
from app.db.base import engine, SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()