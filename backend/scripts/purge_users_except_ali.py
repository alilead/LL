"""
Deactivate / tombstone all users except ali@the-leadlab.com.
Run from backend/: py scripts/purge_users_except_ali.py

Requires DATABASE_URL (or app settings) in environment / .env.
"""
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func

from app.db.session import SessionLocal
from app.models.user import User

PROTECTED_EMAIL = "ali@the-leadlab.com"


def main() -> None:
    db = SessionLocal()
    try:
        ali = (
            db.query(User)
            .filter(func.lower(User.email) == PROTECTED_EMAIL)
            .first()
        )
        if not ali:
            print(f"ERROR: No user found with email {PROTECTED_EMAIL}")
            sys.exit(1)

        ali.role = "admin"
        ali.is_superuser = True
        ali.is_active = True
        ali.updated_at = datetime.utcnow()

        others = (
            db.query(User)
            .filter(func.lower(User.email) != PROTECTED_EMAIL)
            .all()
        )
        affected = 0
        for row in others:
            row.email = f"deleted+user-{row.id}-{int(time.time())}@deleted.local"
            if hasattr(row, "username"):
                row.username = None
            row.first_name = "Deleted"
            row.last_name = f"User {row.id}"
            row.is_active = False
            row.is_superuser = False
            row.role = "user"
            row.updated_at = datetime.utcnow()
            affected += 1

        db.commit()
        print(f"OK: Kept {PROTECTED_EMAIL} (id={ali.id}, admin=True, active=True).")
        print(f"OK: Deactivated/tombstoned {affected} other user(s).")
    except Exception as exc:
        db.rollback()
        print(f"FAILED: {exc}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
