import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import verify_password, get_password_hash

def check_user_password():
    db = SessionLocal()
    try:
        # Get user
        user = db.query(User).filter(User.email == "firat@the-leadlab.com").first()
        if not user:
            print("User not found!")
            return
        
        print(f"\nUser Details:")
        print(f"Email: {user.email}")
        print(f"Password Hash: {user.password_hash}")
        
        # Test some common passwords
        test_passwords = ["password", "123456", "admin", "test123", "leadlab"]
        print("\nTesting common passwords:")
        for pwd in test_passwords:
            result = verify_password(pwd, user.password_hash)
            print(f"Password '{pwd}': {'✓' if result else '✗'}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_user_password()
