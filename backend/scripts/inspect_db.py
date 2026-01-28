import os
import sys
from sqlalchemy import create_engine, inspect
import dotenv
dotenv.load_dotenv()

# Veritabanı bağlantı bilgileri
DATABASE_URL = "mysql+pymysql://httpdvic1_admin:JVI~dEtn6#gs@localhost:3306/httpdvic1_leadlab"

# Create engine
engine = create_engine(DATABASE_URL)

# Create inspector
inspector = inspect(engine)

# Get all table names
tables = inspector.get_table_names()

print("\nDatabase Tables and Columns:")
print("=" * 50)

for table_name in tables:
    print(f"\nTable: {table_name}")
    print("-" * 30)
    
    # Get columns for the table
    columns = inspector.get_columns(table_name)
    for column in columns:
        nullable = "NULL" if column['nullable'] else "NOT NULL"
        print(f"{column['name']}: {column['type']} {nullable}")

print("\nDone!")
