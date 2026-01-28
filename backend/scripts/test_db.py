from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

def test_db_connection():
    try:
        # MySQL bağlantı URL'ini güncelle
        DATABASE_URL = "mysql+pymysql://httpdvic1_admin:JVI~dEtn6#gs@localhost:3306/httpdvic1_leadlab"
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute("SELECT 1")
            print("Database connection successful!")
            return True
    except SQLAlchemyError as e:
        print(f"Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_db_connection()
