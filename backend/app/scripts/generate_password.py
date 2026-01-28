from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

# Firat's password
print("Firat's password hash:")
print(get_password_hash("147741_a"))

# Joshua's password
print("\nJoshua's password hash:")
print(get_password_hash("NeverTrust1!j"))
