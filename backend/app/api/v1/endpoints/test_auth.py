from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.auth import UserLogin
from app import crud
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/simple-login")
async def simple_login(
    login_data: dict,
    db: Session = Depends(deps.get_db)
):
    """
    Basit bir login endpoint'i - sadece başarılı/başarısız döner
    """
    try:
        logger.debug(f"Simple login attempt with data: {login_data}")
        
        # E-posta ve şifre kontrol
        email = login_data.get("email")
        password = login_data.get("password")
        
        if not email or not password:
            return {"success": False, "message": "Email and password are required"}
            
        # Kullanıcıyı bul
        user = crud.user.get_by_email(db, email=email)
        if not user:
            return {"success": False, "message": "User not found", "email": email}
            
        # Şifreyi doğrula
        from app.core.security import verify_password
        is_password_valid = verify_password(password, user.password_hash)
        
        # Sonucu döndür
        return {
            "success": is_password_valid,
            "user_id": user.id if is_password_valid else None,
            "email": user.email,
            "message": "Login successful" if is_password_valid else "Invalid password"
        }
    except Exception as e:
        logger.exception(f"Error in simple login: {str(e)}")
        return {"success": False, "message": f"Error: {str(e)}", "details": type(e).__name__}
        
@router.post("/user-exists")
async def check_user_exists(
    email_data: dict,
    db: Session = Depends(deps.get_db)
):
    """
    Kullanıcının var olup olmadığını kontrol et
    """
    try:
        email = email_data.get("email")
        if not email:
            return {"exists": False, "message": "Email is required"}
            
        user = crud.user.get_by_email(db, email=email)
        return {
            "exists": user is not None,
            "email": email,
            "user_id": user.id if user else None
        }
    except Exception as e:
        logger.exception(f"Error checking user: {str(e)}")
        return {"exists": False, "message": f"Error: {str(e)}"}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_user_password(
    data: dict,
    db: Session = Depends(deps.get_db)
):
    """
    Kullanıcı şifresini sıfırla (sadece test/geliştirme için)
    """
    try:
        email = data.get("email")
        new_password = data.get("new_password")
        
        if not email or not new_password:
            return {"success": False, "message": "Email and new_password are required"}
            
        user = crud.user.get_by_email(db, email=email)
        if not user:
            return {"success": False, "message": "User not found"}
            
        # Şifreyi güncelle
        from app.core.security import get_password_hash
        user.password_hash = get_password_hash(new_password)
        db.commit()
        
        return {
            "success": True,
            "message": "Password reset successful",
            "email": email
        }
    except Exception as e:
        db.rollback()
        logger.exception(f"Error resetting password: {str(e)}")
        return {"success": False, "message": f"Error: {str(e)}"} 