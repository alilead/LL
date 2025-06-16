import pymysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection parameters
db_params = {
    'host': 'localhost',
    'user': 'httpdvic1_admin',
    'password': 'JVI~dEtn6#gs',
    'db': 'leadlabv2',
}

def print_table_structure(cursor, table_name):
    print(f"\n{table_name} Table Structure:")
    print("-" * (len(table_name) + 16))
    cursor.execute(f"DESCRIBE {table_name}")
    columns = cursor.fetchall()
    for col in columns:
        print(f"Column: {col[0]}")
        print(f"Type: {col[1]}")
        print(f"Null: {col[2]}")
        print(f"Key: {col[3]}")
        print(f"Default: {col[4]}")
        print(f"Extra: {col[5]}")
        print("-" * 40)

def print_foreign_keys(cursor, table_name):
    print(f"\nForeign Keys for {table_name}:")
    print("-" * (len(table_name) + 20))
    cursor.execute(f"""
        SELECT 
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
            TABLE_SCHEMA = '{db_params['db']}'
            AND TABLE_NAME = '{table_name}'
            AND REFERENCED_TABLE_NAME IS NOT NULL;
    """)
    foreign_keys = cursor.fetchall()
    for fk in foreign_keys:
        print(f"Column: {fk[0]} -> {fk[1]}({fk[2]})")

try:
    # Connect to the database
    connection = pymysql.connect(**db_params)
    
    try:
        with connection.cursor() as cursor:
            # Get all tables
            cursor.execute("""
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = %s
            """, (db_params['db'],))
            
            tables = [row[0] for row in cursor.fetchall()]
            
            # Print structure and foreign keys for each table
            for table in tables:
                print_table_structure(cursor, table)
                print_foreign_keys(cursor, table)
                print("\n" + "="*50 + "\n")
            
    finally:
        connection.close()
        
except Exception as e:
    print(f"Error: {e}")
