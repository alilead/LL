import os

from sqlalchemy import create_engine, text


def main() -> None:
    url = os.environ.get("TARGET_DATABASE_URL")
    if not url:
        raise RuntimeError("Missing TARGET_DATABASE_URL")

    engine = create_engine(url, pool_pre_ping=True)
    with engine.connect() as conn:
        total = conn.execute(text("SELECT count(*) FROM users")).scalar()
        print(f"render_users_total={total}")

        rows = conn.execute(
            text(
                """
                SELECT email, first_name, last_name
                FROM users
                WHERE lower(email) IN ('sandra@the-leadlab.com','joshua@the-leadlab.com','ali@the-leadlab.com')
                ORDER BY email
                """
            )
        ).fetchall()
        print("key_users:")
        for row in rows:
            print(row)


if __name__ == "__main__":
    main()
