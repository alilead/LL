#!/usr/bin/env python3
"""
Test database connection using the same settings as the app.
Run from backend dir: py scripts/check_db_connection.py
Useful when you see "Database connection error" on login.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    from sqlalchemy import create_engine, text
    from app.core.config import settings

    url = settings.DATABASE_URL
    # Mask password in output
    if "@" in url and ":" in url:
        try:
            before_at = url.split("@")[0]
            after_colon = before_at.split(":")[-1]
            if len(after_colon) > 4:
                url_display = url.replace(after_colon, "***")
            else:
                url_display = url.split("@")[1] if "@" in url else url
        except Exception:
            url_display = url[:50] + "..."
    else:
        url_display = url[:80] + ("..." if len(url) > 80 else "")

    print("Testing database connection...")
    print("DATABASE_URL (masked):", url_display)
    print()

    try:
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 10} if "postgresql" in settings.DATABASE_URL else {},
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("OK: Database connection successful.")
        return 0
    except Exception as e:
        print("FAIL: Database connection error.")
        print("Error type:", type(e).__name__)
        print("Message:", str(e))
        return 1

if __name__ == "__main__":
    sys.exit(main())
