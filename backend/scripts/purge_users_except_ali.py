"""
Permanently delete all users except ali@the-leadlab.com.
Run from backend/: py scripts/purge_users_except_ali.py

Requires .env with DATABASE_URL, SECRET_KEY, etc.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.services.user_purge_service import hard_delete_all_except_ali


def main() -> None:
    db = SessionLocal()
    try:
        result = hard_delete_all_except_ali(db)
        print(result["message"])
        print(f"affected={result['affected']}")
    except Exception as exc:
        db.rollback()
        print(f"FAILED: {exc}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
