#!/usr/bin/env python3
"""
List all users in the database (email, id, active, created). No passwords.
Run from backend dir with DATABASE_URL set: py scripts/list_users.py
Works with MySQL/Postgres and schemas with or without username column.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    from sqlalchemy import create_engine, text, inspect

    from app.core.config import settings

    url = settings.DATABASE_URL
    if not url:
        print("ERROR: DATABASE_URL is not set.")
        return 1
    engine = create_engine(url, pool_pre_ping=True)
    insp = inspect(engine)
    cols = [c["name"] for c in insp.get_columns("users")]
    want = ["id", "email", "username", "is_active", "created_at"]
    select_cols = [c for c in want if c in cols]
    if "id" not in select_cols or "email" not in select_cols:
        print("ERROR: users table missing id or email. Columns:", cols)
        return 1
    sql = "SELECT " + ", ".join(select_cols) + " FROM users ORDER BY id"
    with engine.connect() as conn:
        try:
            rows = conn.execute(text(sql)).fetchall()
        except Exception as e:
            print("ERROR:", e)
            return 1
    if not rows:
        print("No users in database.")
        return 0
    idx = {c: i for i, c in enumerate(select_cols)}
    header = f"{'id':<6} {'email':<40}"
    if "username" in select_cols:
        header += f" {'username':<20}"
    if "is_active" in select_cols:
        header += f" {'active':<6}"
    if "created_at" in select_cols:
        header += " created_at"
    print(header)
    print("-" * 90)
    for row in rows:
        uid = row[idx["id"]]
        email = (row[idx["email"]] or "")[:38]
        parts = [f"{uid:<6}", f"{email:<40}"]
        if "username" in select_cols:
            un = (row[idx["username"]] or "")[:18]
            parts.append(f"{un:<20}")
        if "is_active" in select_cols:
            parts.append(f"{str(row[idx['is_active']]):<6}")
        if "created_at" in select_cols:
            parts.append(str(row[idx["created_at"]]))
        print(" ".join(parts))
    print(f"\nTotal: {len(rows)} user(s). Use scripts/reset_password.py to set a password for an email.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
