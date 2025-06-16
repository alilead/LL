import os
import sys

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app.services.csv_importer import CSVImporter
from app.db.session import SessionLocal

def main():
    # Create database session
    db = SessionLocal()
    
    try:
        # Create importer instance
        importer = CSVImporter(db)
        
        # Read and import the CSV file
        with open('sample.csv', 'r') as f:
            csv_content = f.read()
            
        # Import with user_id=1
        result = importer.import_csv(csv_content, user_id=1)
        print("Import result:", result)
        
    except Exception as e:
        print(f"Error during import: {str(e)}")
    finally:
        db.close()
        print("Database session closed")

if __name__ == "__main__":
    main()
