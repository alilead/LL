#!/usr/bin/env python3
"""
List all users in the database (email, id, active, created). No passwords.
Run from backend dir with DATABASE_URL set: py scripts/list_users.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    from sqlalchemy import create_engine, text
    from app.core.config import settings

    url = settings.DATABASE_URL
    if not url:
        print("ERROR: DATABASE_URL is not set.")
        return 1
    engine = create_engine(url, pool_pre_ping=True)
    with engine.connect() as conn:
        try:
            r = conn.execute(text(
                "SELECT id, email, username, is_active, created_at FROM users ORDER BY id"
            ))
            rows = r.fetchall()
        except Exception as e:
            print("ERROR:", e)
            return 1
    if not rows:
        print("No users in database.")
        return 0
    print(f"{'id':<6} {'email':<40} {'username':<20} {'active':<6} created_at")
    print("-" * 90)
    for row in rows:
        uid, email, username, active, created = row
        un = (username or "")[:18]
        print(f"{uid:<6} {(email or '')[:38]:<40} {un:<20} {str(active):<6} {created}")
    print(f"\nTotal: {len(rows)} user(s). Use scripts/reset_password.py to set a password for an email.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
