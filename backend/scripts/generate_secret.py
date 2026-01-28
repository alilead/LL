import secrets
import base64

# Generate 64 byte (512 bit) random secure key
random_bytes = secrets.token_bytes(64)
secret_key = base64.b64encode(random_bytes).decode('utf-8')

print(f"\nSecure SECRET_KEY generated:\n{secret_key}\n")
