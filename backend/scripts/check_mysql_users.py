import pymysql

# Database connection parameters
db_params = {
    'host': 'localhost',
    'user': 'httpdvic1_admin',
    'password': 'JVI~dEtn6#gs',
    'db': 'leadlabv2',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def list_users():
    try:
        # Connect to the database
        connection = pymysql.connect(**db_params)
        
        with connection.cursor() as cursor:
            # Execute SQL query
            cursor.execute('SELECT * FROM users')
            users = cursor.fetchall()
            
            print("\nExisting Users:")
            print("-" * 50)
            for user in users:
                print(f"ID: {user['id']}")
                print(f"Email: {user['email']}")
                print(f"First Name: {user.get('first_name', 'N/A')}")
                print(f"Last Name: {user.get('last_name', 'N/A')}")
                print(f"Is Admin: {user.get('is_admin', False)}")
                print(f"Is Active: {user.get('is_active', False)}")
                print("-" * 50)
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    list_users()
