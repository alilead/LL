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
    'charset': 'utf8mb4'
}

def import_database():
    try:
        # First, connect without selecting a database
        connection = pymysql.connect(**db_params)
        cursor = connection.cursor()
        
        # Create database if it doesn't exist
        cursor.execute("CREATE DATABASE IF NOT EXISTS leadlabv2")
        cursor.execute("USE leadlabv2")
        
        # Read and execute SQL file
        sql_file_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'leadlabv2_2025-01-01_22-36-38.sql'
        )
        
        print("Importing database from:", sql_file_path)
        
        with open(sql_file_path, 'r') as file:
            sql_commands = file.read()
            
        # Split SQL commands by semicolon and execute each one
        for command in sql_commands.split(';'):
            command = command.strip()
            if command:
                try:
                    cursor.execute(command)
                    connection.commit()
                except Exception as e:
                    print(f"Error executing command: {e}")
                    print(f"Command was: {command[:100]}...")  # Print first 100 chars of failed command
        
        print("Database import completed successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    import_database()
