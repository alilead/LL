#!/usr/bin/env python3
"""
Reset password for a user by email. Run from backend dir: py scripts/reset_password.py

Uses DATABASE_URL from .env by default (e.g. local MySQL). To target Render Postgres
without changing DATABASE_URL, set RENDER_DATABASE_URL to the External Database URL
(use postgresql+psycopg2://... if needed). Shell example:

  $env:RENDER_DATABASE_URL="postgresql://..."
  $env:RESET_EMAIL="ali@the-leadlab.com"
  $env:RESET_PASSWORD="..."
  py scripts/reset_password.py
"""
import os
import sys

# Add backend to path so app is importable
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _BACKEND_DIR)


def _resolve_db_url() -> str:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(_BACKEND_DIR, ".env"))
    from app.core.config import settings

    # Prefer Render / one-off URL so DATABASE_URL can stay on local MySQL
    return os.environ.get("RENDER_DATABASE_URL") or settings.DATABASE_URL


def main():
    email = os.environ.get("RESET_EMAIL", "ali@the-leadlab.com")
    new_password = os.environ.get("RESET_PASSWORD", "LeadLab123!")

    from app.core.security import get_password_hash
    from sqlalchemy import create_engine, text

    db_url = _resolve_db_url()
    engine = create_engine(db_url)
    hashed = get_password_hash(new_password)

    with engine.connect() as conn:
        # Detect password column (MySQL may use hashed_password, password_hash, or password)
        try:
            r = conn.execute(text("SELECT id, email FROM users LIMIT 1"))
            r.fetchone()
        except Exception:
            pass
        insp = __import__("sqlalchemy").inspect(engine)
        cols = [c["name"] for c in insp.get_columns("users")]
        pwd_col = next((c for c in cols if "password" in c.lower() or c == "hashed_password"), None)
        if not pwd_col:
            print("Could not find password column in users table. Columns:", cols)
            sys.exit(1)
        # Try exact email then ali@the-leadlab
        for try_email in (email, "ali@the-leadlab"):
            r = conn.execute(
                text("SELECT id, email FROM users WHERE email = :e"),
                {"e": try_email}
            )
            row = r.fetchone()
            if row:
                conn.execute(
                    text(f"UPDATE users SET {pwd_col} = :hp WHERE id = :id"),
                    {"hp": hashed, "id": row[0]}
                )
                conn.commit()
                print(f"Password updated for {row[1]}. Use this to log in: {new_password}")
                return
        print(f"No user found with email '{email}' or 'ali@the-leadlab'. Exiting.")
        sys.exit(1)

if __name__ == "__main__":
    main()
