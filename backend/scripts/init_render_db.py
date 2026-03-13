#!/usr/bin/env python3
"""
Create all database tables (users, organizations, leads, etc.) in the database
that DATABASE_URL points to. Use this for an empty Render PostgreSQL (or any DB)
so that "relation \"users\" does not exist" is fixed.

Run from backend dir with DATABASE_URL set to your Render DB:
  set DATABASE_URL=postgresql://...   (Windows)
  export DATABASE_URL=postgresql://... (Linux/Mac)
  py scripts/init_render_db.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    from sqlalchemy import create_engine
    from app.core.config import settings
    from app.models.base import Base
    # Import all models so they are registered on Base.metadata
    import app.models  # noqa: F401
    import app.models.notification  # noqa: F401
    import app.models.dashboard  # noqa: F401

    url = settings.DATABASE_URL
    if not url:
        print("ERROR: DATABASE_URL is not set.")
        return 1
    # Use a simple engine (no pool size etc.) for one-off init
    engine = create_engine(url, pool_pre_ping=True)
    print("Creating all tables in the database...")
    Base.metadata.create_all(bind=engine)
    print("Done. Tables created successfully.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
