import pymysql
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database connection parameters
db_params = {
    'host': 'localhost',
    'user': 'httpdvic1_admin',
    'password': 'JVI~dEtn6#gs',
    'db': 'leadlabv2',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def check_user_password():
    try:
        # Connect to the database
        connection = pymysql.connect(**db_params)
        
        with connection.cursor() as cursor:
            # Get user's password hash
            cursor.execute('SELECT email, password_hash FROM users WHERE email = %s', 
                         ('firat@the-leadlab.com',))
            user = cursor.fetchone()
            
            if not user:
                print("User not found!")
                return
            
            print(f"\nUser Details:")
            print(f"Email: {user['email']}")
            print(f"Password Hash: {user['password_hash']}")
            
            # Test some common passwords
            test_passwords = ["147741_a"]
            print("\nTesting password:")
            for pwd in test_passwords:
                try:
                    result = verify_password(pwd, user['password_hash'])
                    print(f"Password '{pwd}': {'✓' if result else '✗'}")
                except Exception as e:
                    print(f"Error testing password '{pwd}': {e}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    check_user_password()
