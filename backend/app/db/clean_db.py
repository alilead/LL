import sys
import os

# Add the parent directory to the Python path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(BACKEND_DIR)

# Set the .env file location
os.environ["ENV_FILE"] = os.path.join(BACKEND_DIR, ".env")

import logging
from app.db.session import SessionLocal, engine
from app.models.base import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_database():
    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        logger.info("Successfully dropped all tables")

        # Recreate all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Successfully recreated all tables")

    except Exception as e:
        logger.error(f"Error cleaning database: {e}")
        raise

def main():
    clean_database()

if __name__ == "__main__":
    main()
