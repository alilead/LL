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

def update_password(email: str, new_password: str):
    try:
        # Connect to the database
        connection = pymysql.connect(**db_params)
        
        # Generate new password hash
        password_hash = pwd_context.hash(new_password)
        print(f"\nGenerated hash for password: {password_hash}")
        
        with connection.cursor() as cursor:
            # Update user's password hash
            cursor.execute(
                'UPDATE users SET password_hash = %s WHERE email = %s', 
                (password_hash, email)
            )
            connection.commit()
            
            # Verify the update
            cursor.execute(
                'SELECT email, password_hash FROM users WHERE email = %s', 
                (email,)
            )
            user = cursor.fetchone()
            
            print(f"\nUpdated User Details:")
            print(f"Email: {user['email']}")
            print(f"New Password Hash: {user['password_hash']}")
            
            # Verify the password works
            result = pwd_context.verify(new_password, user['password_hash'])
            print(f"\nPassword verification test: {'✓' if result else '✗'}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    update_password("firat@the-leadlab.com", "147741_a")
