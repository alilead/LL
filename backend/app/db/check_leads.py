from sqlalchemy import text
from app.db.base import engine

def check_leads():
    with engine.connect() as connection:
        try:
            # Check total number of leads
            result = connection.execute(text("SELECT COUNT(*) FROM leads"))
            total_leads = result.scalar()
            print(f"Total leads in database: {total_leads}")
            
            # Check leads with user IDs
            result = connection.execute(text("""
                SELECT user_id, COUNT(*) as lead_count 
                FROM leads 
                GROUP BY user_id
            """))
            print("\nLeads per user:")
            for row in result:
                print(f"User ID: {row[0]}, Lead count: {row[1]}")
            
            # Check for any NULL values in important fields
            result = connection.execute(text("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id,
                    COUNT(CASE WHEN unique_lead_id IS NULL THEN 1 END) as null_unique_id,
                    COUNT(CASE WHEN is_verified IS NULL THEN 1 END) as null_verified
                FROM leads
            """))
            row = result.fetchone()
            print("\nNULL value check:")
            print(f"Total leads: {row[0]}")
            print(f"Leads with NULL user_id: {row[1]}")
            print(f"Leads with NULL unique_lead_id: {row[2]}")
            print(f"Leads with NULL is_verified: {row[3]}")
            
        except Exception as e:
            print(f"Error checking leads: {e}")

if __name__ == "__main__":
    check_leads()
