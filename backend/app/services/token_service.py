from typing import Optional, Dict, Union, Any, List
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.token import Token
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, DataType
from app.core.constants import PRICES, TOKEN_VALUE_USD
from fastapi import HTTPException
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class TokenService:
    @staticmethod
    async def check_and_deduct_tokens(
        db: Session,
        user_id: int,
        data_type: str,
        quantity: int = 1
    ) -> bool:
        """Token kontrolü yap ve düş"""
        
        # Fiyatı al
        if data_type not in PRICES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data type: {data_type}"
            )
            
        required_tokens = PRICES[data_type] * quantity
        
        try:
            # Direct SQL for token retrieval
            result = db.execute(
                text("SELECT * FROM tokens WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            token_row = result.fetchone()
            
            if not token_row or token_row.balance < required_tokens:
                raise HTTPException(
                    status_code=402,
                    detail=f"Insufficient tokens. Required: {required_tokens}, Available: {token_row.balance if token_row else 0}"
                )
                
            # Update token balance using SQL
            db.execute(
                text("UPDATE tokens SET balance = balance - :amount WHERE user_id = :user_id"),
                {"amount": required_tokens, "user_id": user_id}
            )
            
            # Create transaction using SQL
            db.execute(
                text("""
                    INSERT INTO transactions 
                    (user_id, type, amount, data_type, description) 
                    VALUES (:user_id, :type, :amount, :data_type, :description)
                """),
                {
                    "user_id": user_id,
                    "type": TransactionType.USAGE.value,
                    "amount": required_tokens,
                    "data_type": data_type,
                    "description": f"Purchase of {data_type} data"
                }
            )
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error in check_and_deduct_tokens: {str(e)}")
            raise
    
    @staticmethod
    async def add_tokens(
        db: Session,
        user_id: int,
        usd_amount: Decimal,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """USD karşılığı token ekle"""
        token_amount = usd_amount  # 1 Token = 1 USD
        
        logger.info(f"Adding {token_amount} tokens to user {user_id}")
        
        try:
            # Check if token exists
            result = db.execute(
                text("SELECT * FROM tokens WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            token_row = result.fetchone()
            
            if not token_row:
                logger.info(f"No token record found for user {user_id}. Creating new record.")
                # Create token
                db.execute(
                    text("INSERT INTO tokens (user_id, balance) VALUES (:user_id, :balance)"),
                    {"user_id": user_id, "balance": token_amount}
                )
                logger.info(f"Created new token record for user {user_id} with initial balance {token_amount}")
            else:
                logger.info(f"Existing token record found for user {user_id}. Current balance: {token_row.balance}")
                # Update token
                db.execute(
                    text("UPDATE tokens SET balance = balance + :amount WHERE user_id = :user_id"),
                    {"amount": token_amount, "user_id": user_id}
                )
                logger.info(f"Updated token balance for user {user_id}. Added {token_amount}")
                
            # Eğer description parametresi verilmezse varsayılan açıklamayı kullan
            transaction_description = description if description else f"Token purchase: ${usd_amount}"
            
            # Create transaction
            transaction_result = db.execute(
                text("""
                    INSERT INTO transactions 
                    (user_id, type, amount, data_type, description) 
                    VALUES (:user_id, :type, :amount, :data_type, :description)
                """),
                {
                    "user_id": user_id,
                    "type": TransactionType.PURCHASE.value,
                    "amount": token_amount,
                    "data_type": DataType.TOKEN_PURCHASE.value,
                    "description": transaction_description
                }
            )
            
            # Ensure transaction is created successfully
            if transaction_result.rowcount == 0:
                logger.error(f"Failed to insert transaction record for user {user_id}")
                raise Exception("Failed to insert transaction record")
            
            logger.info(f"Created transaction record for token purchase. User: {user_id}, Amount: {token_amount}, Description: {transaction_description}")
            
            # Explicitly commit the transaction
            try:
                db.commit()
                logger.info(f"Successfully committed token purchase transaction for user {user_id}")
            except Exception as commit_error:
                logger.error(f"Error committing transaction: {str(commit_error)}")
                db.rollback()
                raise
            
            # Get updated balance
            result = db.execute(
                text("SELECT balance FROM tokens WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            new_balance_row = result.fetchone()
            
            # Null kontrolü ekleyerek
            if new_balance_row is None:
                logger.warning(f"Could not retrieve updated balance for user {user_id}. Returning 0.")
                return {"user_id": user_id, "balance": 0}
            
            logger.info(f"Updated token balance for user {user_id}: {new_balance_row.balance}")
            
            return {"user_id": user_id, "balance": new_balance_row.balance}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error in add_tokens: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    @staticmethod
    async def check_data_access(
        db: Session,
        user_id: int,
        lead_id: int,
        data_type: str
    ) -> bool:
        """Veriye erişim yetkisi kontrol et"""
        
        try:
            # Admin kontrolü
            result = db.execute(
                text("SELECT is_admin FROM users WHERE id = :user_id"),
                {"user_id": user_id}
            )
            user_row = result.fetchone()
            
            if user_row and user_row.is_admin:
                return True
                
            # Satın alma geçmişi kontrolü
            result = db.execute(
                text("""
                    SELECT COUNT(*) as count FROM transactions 
                    WHERE user_id = :user_id 
                    AND data_type = :data_type 
                    AND lead_id = :lead_id 
                    AND type = :type
                """),
                {
                    "user_id": user_id,
                    "data_type": data_type,
                    "lead_id": lead_id,
                    "type": TransactionType.PURCHASE.value
                }
            )
            count_row = result.fetchone()
            
            # Null kontrolü
            if count_row is None:
                return False
                
            return count_row.count > 0
            
        except Exception as e:
            logger.error(f"Error in check_data_access: {str(e)}")
            return False
    
    @staticmethod
    async def get_purchase_history(
        db: Session,
        user_id: int,
        lead_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Satın alma geçmişini getir"""
        try:
            query = """
                SELECT * FROM transactions 
                WHERE user_id = :user_id 
                AND type = :type
            """
            params = {"user_id": user_id, "type": TransactionType.PURCHASE.value}
            
            if lead_id:
                query += " AND lead_id = :lead_id"
                params["lead_id"] = lead_id
                
            result = db.execute(text(query + " ORDER BY created_at DESC"), params)
            
            return [
                {
                    "id": row.id,
                    "user_id": row.user_id,
                    "lead_id": row.lead_id,
                    "type": row.type,
                    "amount": float(row.amount),
                    "data_type": row.data_type,
                    "description": row.description,
                    "created_at": row.created_at.isoformat() if row.created_at else None
                }
                for row in result.fetchall()
            ]
            
        except Exception as e:
            logger.error(f"Error in get_purchase_history: {str(e)}")
            return []
    
    @staticmethod
    async def get_token_balance(db: Session, user_id: int) -> int:
        """
        Get the token balance for a user
        """
        try:
            # Direct SQL query to avoid ORM mapper issues
            result = db.execute(
                text("SELECT balance FROM tokens WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            row = result.fetchone()
            
            # Convert to int and return
            return int(float(row.balance)) if row else 0
            
        except Exception as e:
            logger.error(f"Error getting token balance: {str(e)}")
            return 0