import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.security import get_password_hash

def create_admin(email: str, password: str, username: str = None):
    if username is None:
        username = email.split('@')[0]  # Use part before @ as username
        
    # Create database engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Hash the password
    password_hash = get_password_hash(password)
    
    # Create connection
    with engine.connect() as connection:
        # Check if user exists
        result = connection.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": email}
        )
        user = result.fetchone()
        
        if user:
            # Update existing user
            connection.execute(
                text("""
                    UPDATE users 
                    SET password_hash = :password_hash, 
                        is_superuser = TRUE,
                        is_active = TRUE,
                        username = :username
                    WHERE email = :email
                """),
                {"email": email, "password_hash": password_hash, "username": username}
            )
            print(f"Updated existing user {email} as admin")
        else:
            # Create new user
            connection.execute(
                text("""
                    INSERT INTO users (email, username, password_hash, is_superuser, is_active) 
                    VALUES (:email, :username, :password_hash, TRUE, TRUE)
                """),
                {"email": email, "username": username, "password_hash": password_hash}
            )
            print(f"Created new admin user {email}")
        
        connection.commit()
        
        # Verify the user
        result = connection.execute(
            text("SELECT id, email, username, is_superuser FROM users WHERE email = :email"),
            {"email": email}
        )
        user = result.fetchone()
        print(f"User {user.email} (ID: {user.id}, username: {user.username}) is now a superuser: {user.is_superuser}")

if __name__ == "__main__":
    create_admin("firat@the-leadlab.com", "147741_a", "firat")
