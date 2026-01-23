import sys
import os

# Add the parent directory to the Python path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(BACKEND_DIR)

# Set the .env file location
os.environ["ENV_FILE"] = os.path.join(BACKEND_DIR, ".env")

import logging
from sqlalchemy import text
from app.db.session import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db() -> None:
    logger.info("Initializing database...")
    
    # Read SQL file
    sql_file_path = os.path.join(BACKEND_DIR, "app", "migrations", "possible_new_db.sql")
    with open(sql_file_path, "r") as f:
        sql_script = f.read()
    
    # Execute SQL script
    with engine.connect() as conn:
        # Split script into individual statements
        statements = sql_script.split(";")
        
        for statement in statements:
            # Skip empty statements
            if statement.strip():
                try:
                    conn.execute(text(statement))
                    conn.commit()
                except Exception as e:
                    logger.error(f"Error executing SQL: {e}")
                    raise
    
    logger.info("Database initialized successfully!")

def main() -> None:
    init_db()

if __name__ == "__main__":
    main()
