from sqlalchemy import create_engine, text
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    # Connect directly to database
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        try:
            # Check if user 1 exists
            result = connection.execute(text("SELECT id, email, first_name, last_name FROM users WHERE id = 1"))
            user = result.fetchone()
            if user:
                logger.info(f"Found user: {user.first_name} {user.last_name} ({user.email})")
            else:
                logger.warning("User with ID 1 not found")
                
            # Check token balance for user 1
            result = connection.execute(text("SELECT * FROM tokens WHERE user_id = 1"))
            token = result.fetchone()
            if token:
                logger.info(f"User 1 token balance: {token.balance}")
            else:
                logger.warning("No token found for user 1")
                
            # Create token if it doesn't exist
            if not token:
                logger.info("Creating token for user 1 with balance 100")
                connection.execute(
                    text("INSERT INTO tokens (user_id, balance) VALUES (1, 100)")
                )
                connection.commit()
                logger.info("Token created successfully")
                
            # Check transactions
            result = connection.execute(text("SELECT COUNT(*) as count FROM transactions"))
            count = result.fetchone().count
            logger.info(f"Total transactions: {count}")
            
            # Show last 5 transactions
            if count > 0:
                result = connection.execute(
                    text("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5")
                )
                for idx, transaction in enumerate(result.fetchall()):
                    logger.info(f"Transaction {idx+1}: Type={transaction.type}, Amount={transaction.amount}")
                    
        except Exception as e:
            logger.error(f"Error: {str(e)}")

if __name__ == "__main__":
    main() 