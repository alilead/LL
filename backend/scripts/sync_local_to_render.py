#!/usr/bin/env python3
"""
Option B: Sync organizations and users from local DB to Render Postgres.
Run from backend dir. Requires LOCAL_DATABASE_URL and RENDER_DATABASE_URL.

  Windows (PowerShell):
    $env:LOCAL_DATABASE_URL = "mysql+pymysql://user:pass@localhost:3306/leadlab?charset=utf8mb4"
    $env:RENDER_DATABASE_URL = "postgresql://...@....frankfurt-postgres.render.com/leadlab"
    py scripts/sync_local_to_render.py

  Linux/Mac:
    export LOCAL_DATABASE_URL="mysql+pymysql://..."
    export RENDER_DATABASE_URL="postgresql://..."
    python scripts/sync_local_to_render.py

Prerequisites:
  - Render DB tables exist (run init_render_db.py with RENDER_DATABASE_URL first).
  - Local DB has the users/orgs you want.
"""
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    local_url = os.environ.get("LOCAL_DATABASE_URL")
    render_url = os.environ.get("RENDER_DATABASE_URL")
    if not local_url:
        print("ERROR: Set LOCAL_DATABASE_URL (your local MySQL/Postgres URL).")
        return 1
    if not render_url:
        print("ERROR: Set RENDER_DATABASE_URL (Render External Database URL).")
        return 1

    from sqlalchemy import create_engine, text
    from sqlalchemy import inspect

    local_engine = create_engine(local_url, pool_pre_ping=True)
    render_engine = create_engine(render_url, pool_pre_ping=True)

    # Detect password column on local users table
    insp = inspect(local_engine)
    user_cols = [c["name"] for c in insp.get_columns("users")]
    pwd_col = next((c for c in user_cols if "password" in c.lower() or c == "hashed_password"), None)
    if not pwd_col:
        print("ERROR: Could not find password column in local users table.")
        return 1

    # Optional: org columns (some DBs have different names)
    org_cols = [c["name"] for c in insp.get_columns("organizations")]
    has_created_at = "created_at" in org_cols
    has_updated_at = "updated_at" in org_cols

    with local_engine.connect() as local_conn, render_engine.connect() as render_conn:
        # 1) Organizations: read from local, insert into Render (skip if name exists)
        org_sel = "SELECT id, name, description, website, is_active FROM organizations ORDER BY id"
        if has_created_at and has_updated_at:
            org_sel = "SELECT id, name, description, website, is_active, created_at, updated_at FROM organizations ORDER BY id"
        local_orgs = local_conn.execute(text(org_sel)).fetchall()
        old_to_new_org: dict[int, int] = {}

        for row in local_orgs:
            row_id = row[0]
            name = row[1]
            description = row[2] if len(row) > 2 else None
            website = row[3] if len(row) > 3 else None
            is_active = row[4] if len(row) > 4 else True
            created_at = row[5] if has_created_at and len(row) > 5 else datetime.utcnow()
            updated_at = row[6] if has_updated_at and len(row) > 6 else datetime.utcnow()

            # Check if org already exists on Render by name
            existing = render_conn.execute(
                text("SELECT id FROM organizations WHERE name = :name"),
                {"name": name}
            ).fetchone()
            if existing:
                old_to_new_org[row_id] = existing[0]
                print(f"  Org '{name}' already exists on Render (id={existing[0]}).")
                continue

            if has_created_at and has_updated_at:
                render_conn.execute(
                    text("""
                        INSERT INTO organizations (name, description, website, is_active, created_at, updated_at)
                        VALUES (:name, :description, :website, :is_active, :created_at, :updated_at)
                    """),
                    {
                        "name": name,
                        "description": description,
                        "website": website,
                        "is_active": is_active,
                        "created_at": created_at,
                        "updated_at": updated_at,
                    }
                )
            else:
                render_conn.execute(
                    text("""
                        INSERT INTO organizations (name, description, website, is_active)
                        VALUES (:name, :description, :website, :is_active)
                    """),
                    {"name": name, "description": description, "website": website, "is_active": is_active}
                )
            render_conn.commit()

            # Get new id (Postgres)
            new_id = render_conn.execute(text("SELECT id FROM organizations WHERE name = :name"), {"name": name}).fetchone()[0]
            old_to_new_org[row_id] = new_id
            print(f"  Created org '{name}' on Render (old id {row_id} -> new id {new_id}).")

        if not old_to_new_org:
            print("No organizations to sync (or all already exist).")

        # 2) Users: read from local, insert into Render (skip if email exists)
        user_col_list = ["id", "organization_id", "email", "username", pwd_col, "first_name", "last_name", "is_active", "role", "created_at", "updated_at"]
        if "is_superuser" in user_cols:
            user_col_list.insert(user_col_list.index("is_active") + 1, "is_superuser")
        user_sel = "SELECT " + ", ".join(user_col_list) + " FROM users ORDER BY id"
        try:
            local_users = local_conn.execute(text(user_sel)).fetchall()
        except Exception:
            user_sel = f"SELECT id, organization_id, email, username, {pwd_col}, first_name, last_name, is_active, created_at, updated_at FROM users ORDER BY id"
            user_col_list = ["id", "organization_id", "email", "username", pwd_col, "first_name", "last_name", "is_active", "created_at", "updated_at"]
            local_users = local_conn.execute(text(user_sel)).fetchall()

        for row in local_users:
            row = list(row)
            by_name = dict(zip(user_col_list, row))
            old_org_id = by_name["organization_id"]
            email = by_name["email"]
            username = by_name.get("username")
            hashed = by_name[pwd_col]
            first_name = by_name.get("first_name")
            last_name = by_name.get("last_name")
            is_active = by_name.get("is_active", True)
            is_superuser = by_name.get("is_superuser", False)
            role = by_name.get("role") or "user"
            created_at = by_name.get("created_at") or datetime.utcnow()
            updated_at = by_name.get("updated_at") or datetime.utcnow()

            new_org_id = old_to_new_org.get(old_org_id)
            if new_org_id is None:
                print(f"  Skip user {email}: organization id {old_org_id} not found on Render.")
                continue

            existing = render_conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email}).fetchone()
            if existing:
                print(f"  User {email} already exists on Render. Skipped.")
                continue

            render_conn.execute(
                text("""
                    INSERT INTO users (organization_id, email, username, hashed_password, first_name, last_name, is_active, is_superuser, role, created_at, updated_at)
                    VALUES (:organization_id, :email, :username, :hashed_password, :first_name, :last_name, :is_active, :is_superuser, :role, :created_at, :updated_at)
                """),
                {
                    "organization_id": new_org_id,
                    "email": email,
                    "username": username or None,
                    "hashed_password": hashed,
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_active": bool(is_active),
                    "is_superuser": bool(is_superuser),
                    "role": role or "user",
                    "created_at": created_at,
                    "updated_at": updated_at,
                }
            )
            render_conn.commit()
            print(f"  Synced user {email} to Render (org id {new_org_id}).")

    print("Done. Render DB now has the same organizations and users as local (same passwords).")
    return 0

if __name__ == "__main__":
    sys.exit(main())
