import os
from typing import Any, Dict

from sqlalchemy import create_engine, inspect, text


def env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def main() -> None:
    source_url = env("SOURCE_DATABASE_URL")
    target_url = env("TARGET_DATABASE_URL")

    source = create_engine(source_url, pool_pre_ping=True)
    target = create_engine(target_url, pool_pre_ping=True)

    source_cols = {c["name"] for c in inspect(source).get_columns("users")}
    target_cols = {c["name"] for c in inspect(target).get_columns("users")}

    if "email" not in source_cols or "email" not in target_cols:
        raise RuntimeError("Both source and target users tables must contain email column")

    source_read_cols = [
        c
        for c in [
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_superuser",
            "is_admin",
            "organization_id",
            "created_at",
            "updated_at",
            "password_hash",
            "hashed_password",
        ]
        if c in source_cols
    ]

    with source.connect() as src:
        rows = list(src.execute(text(f"SELECT {', '.join(source_read_cols)} FROM users")).mappings())

    inserted = 0
    updated = 0
    skipped = 0

    with target.begin() as tgt:
        for row in rows:
            email = (row.get("email") or "").strip()
            if not email:
                skipped += 1
                continue

            payload: Dict[str, Any] = {"email": email}

            for key in ["first_name", "last_name", "is_active", "is_superuser", "organization_id", "created_at", "updated_at"]:
                if key in target_cols and key in row:
                    payload[key] = row.get(key)

            # MySQL stores bools as 0/1 ints; convert for Postgres boolean columns.
            for bool_key in ["is_active", "is_superuser"]:
                if bool_key in payload:
                    payload[bool_key] = bool(payload[bool_key])

            if "is_admin" in target_cols and "is_admin" in row:
                payload["is_admin"] = row.get("is_admin")
            elif "role" in target_cols and "is_admin" in row:
                payload["role"] = "admin" if row.get("is_admin") else "member"

            # Handle password column differences.
            if "hashed_password" in target_cols:
                payload["hashed_password"] = row.get("hashed_password") or row.get("password_hash")
            elif "password_hash" in target_cols:
                payload["password_hash"] = row.get("password_hash") or row.get("hashed_password")

            existing = tgt.execute(
                text("SELECT id FROM users WHERE lower(email)=lower(:email) LIMIT 1"),
                {"email": email},
            ).fetchone()

            # Remove keys that don't have value on insert/update
            payload = {k: v for k, v in payload.items() if v is not None}

            if existing:
                set_parts = [f"{k} = :{k}" for k in payload.keys() if k != "email"]
                if set_parts:
                    tgt.execute(
                        text(f"UPDATE users SET {', '.join(set_parts)} WHERE lower(email)=lower(:email)"),
                        payload,
                    )
                updated += 1
            else:
                cols = ", ".join(payload.keys())
                vals = ", ".join(f":{k}" for k in payload.keys())
                tgt.execute(text(f"INSERT INTO users ({cols}) VALUES ({vals})"), payload)
                inserted += 1

    print(f"Sync complete: inserted={inserted}, updated={updated}, skipped={skipped}, source_rows={len(rows)}")


if __name__ == "__main__":
    main()
