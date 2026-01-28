import os
import sys
from typing import Iterable, Dict, Any, List

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, MetaData, Table, text, inspect
from sqlalchemy.exc import NoSuchTableError
from sqlalchemy.engine import Engine
from app import models


DEFAULT_TABLE_ORDER = [
    "organizations",
    "users",
    "currencies",
    "lead_stages",
    "tags",
    "leads",
    "deals",
    "tasks",
    "activities",
    "events",
    "notes",
    "messages",
    "notifications",
    "files",
    "team_invitations",
    "tokens",
    "transactions",
]


def get_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def connect_engine(url: str) -> Engine:
    return create_engine(url, pool_pre_ping=True)


def fetch_rows(source: Engine, table_name: str, columns: List[str]) -> Iterable[Dict[str, Any]]:
    column_list = ", ".join(columns)
    with source.connect() as conn:
        result = conn.execute(text(f"SELECT {column_list} FROM {table_name}"))
        for row in result.mappings():
            yield dict(row)


def chunked(iterable: Iterable[Dict[str, Any]], size: int):
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


def prepare_table(
    target: Engine,
    metadata: MetaData,
    table_name: str,
) -> Table:
    return Table(table_name, metadata, autoload_with=target)


def migrate_table(
    source: Engine,
    target: Engine,
    table_name: str,
    batch_size: int = 500,
) -> int:
    source_columns = inspect(source).get_columns(table_name)
    try:
        target_columns = inspect(target).get_columns(table_name)
    except NoSuchTableError:
        print(f"Skipping {table_name}: table missing in target")
        return 0

    if not source_columns or not target_columns:
        print(f"Skipping {table_name}: table missing in source or target")
        return 0

    source_column_names = {col["name"] for col in source_columns}
    target_column_names = {col["name"] for col in target_columns}

    column_map = [name for name in source_column_names if name in target_column_names]

    # Handle known column name differences
    if table_name == "users" and "password_hash" in source_column_names and "hashed_password" in target_column_names:
        column_map = [name for name in column_map if name != "password_hash"]
        column_map.append("hashed_password")

    if not column_map:
        print(f"Skipping {table_name}: no common columns")
        return 0

    metadata = MetaData()
    target_table = prepare_table(target, metadata, table_name)

    def transform_row(row: Dict[str, Any]) -> Dict[str, Any]:
        if table_name == "users" and "hashed_password" in column_map:
            row["hashed_password"] = row.pop("password_hash", None)
        if table_name == "events":
            if row.get("timezone") in (None, ""):
                row["timezone"] = "UTC"
        return {key: row.get(key) for key in column_map}

    rows = (transform_row(row) for row in fetch_rows(source, table_name, list(source_column_names)))

    inserted = 0
    with target.begin() as conn:
        for batch in chunked(rows, batch_size):
            conn.execute(target_table.insert(), batch)
            inserted += len(batch)

    print(f"Migrated {table_name}: {inserted} rows")
    return inserted


def truncate_tables(target: Engine, tables: List[str]) -> None:
    with target.begin() as conn:
        for table_name in reversed(tables):
            if table_name in inspect(target).get_table_names():
                conn.execute(text(f"DELETE FROM {table_name}"))
    print("Target tables truncated")


def main() -> None:
    source_url = get_env("SOURCE_DATABASE_URL")
    target_url = get_env("TARGET_DATABASE_URL")
    batch_size = int(os.environ.get("BATCH_SIZE", "500"))
    table_list = os.environ.get("TABLES")
    tables = table_list.split(",") if table_list else DEFAULT_TABLE_ORDER
    tables = [table.strip() for table in tables if table.strip()]

    source_engine = connect_engine(source_url)
    target_engine = connect_engine(target_url)

    if os.environ.get("CREATE_TABLES", "false").lower() in ("1", "true", "yes"):
        models.Base.metadata.create_all(bind=target_engine)
        print("Target tables created/verified")

    if os.environ.get("TRUNCATE_TARGET", "false").lower() in ("1", "true", "yes"):
        truncate_tables(target_engine, tables)

    for table_name in tables:
        migrate_table(source_engine, target_engine, table_name, batch_size=batch_size)

    print("Migration complete")


if __name__ == "__main__":
    main()
