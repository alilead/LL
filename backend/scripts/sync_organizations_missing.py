import os
from typing import Dict, Any

from sqlalchemy import create_engine, text


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

    with source.connect() as src:
        source_rows = list(
            src.execute(
                text(
                    """
                    SELECT id, name, description, website, is_active, created_at, updated_at
                    FROM organizations
                    """
                )
            ).mappings()
        )

    with target.connect() as tgt:
        target_ids = {r[0] for r in tgt.execute(text("SELECT id FROM organizations")).fetchall()}

    inserted = 0
    with target.begin() as tgt:
        for row in source_rows:
            org_id = row["id"]
            if org_id in target_ids:
                continue
            payload: Dict[str, Any] = {
                "id": org_id,
                "name": row.get("name"),
                "description": row.get("description"),
                "website": row.get("website"),
                "is_active": bool(row.get("is_active")) if row.get("is_active") is not None else True,
                "created_at": row.get("created_at"),
                "updated_at": row.get("updated_at"),
            }
            tgt.execute(
                text(
                    """
                    INSERT INTO organizations (id, name, description, website, is_active, created_at, updated_at)
                    VALUES (:id, :name, :description, :website, :is_active, :created_at, :updated_at)
                    """
                ),
                payload,
            )
            inserted += 1

    print(f"Organizations sync complete: inserted_missing={inserted}, source_total={len(source_rows)}")


if __name__ == "__main__":
    main()
