import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def make_superuser(email: str):
    # Create database engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Create connection
    with engine.connect() as connection:
        # Update user to superuser
        result = connection.execute(
            text("UPDATE users SET is_superuser = TRUE WHERE email = :email"),
            {"email": email}
        )
        connection.commit()
        
        # Verify the update
        result = connection.execute(
            text("SELECT id, email, is_superuser FROM users WHERE email = :email"),
            {"email": email}
        )
        user = result.fetchone()
        if user:
            print(f"User {user.email} (ID: {user.id}) is now a superuser: {user.is_superuser}")
        else:
            print(f"No user found with email {email}")

if __name__ == "__main__":
    make_superuser("firat@the-leadlab.com")
