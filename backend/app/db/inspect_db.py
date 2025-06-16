import sys
import os

# Add the parent directory to the Python path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(BACKEND_DIR)

# Set the .env file location
os.environ["ENV_FILE"] = os.path.join(BACKEND_DIR, ".env")

import logging
from sqlalchemy import inspect, text
from app.db.session import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def inspect_database():
    inspector = inspect(engine)
    
    # Get all table names
    tables = inspector.get_table_names()
    logger.info(f"\nFound {len(tables)} tables in database:")
    
    # Inspect each table
    for table_name in tables:
        logger.info(f"\nTable: {table_name}")
        
        # Get columns
        columns = inspector.get_columns(table_name)
        logger.info("Columns:")
        for column in columns:
            logger.info(f"  - {column['name']}: {column['type']}")
        
        # Get primary keys
        pks = inspector.get_pk_constraint(table_name)
        if pks['constrained_columns']:
            logger.info(f"Primary keys: {', '.join(pks['constrained_columns'])}")
        
        # Get foreign keys
        fks = inspector.get_foreign_keys(table_name)
        if fks:
            logger.info("Foreign keys:")
            for fk in fks:
                logger.info(f"  - {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")

def main():
    logger.info("Inspecting database...")
    inspect_database()
    logger.info("\nDatabase inspection completed!")

if __name__ == "__main__":
    main()
