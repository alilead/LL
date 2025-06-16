#!/usr/bin/env python3
"""
Şifre hash kontrolü ve düzeltme aracı
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.core.security import pwd_context, get_password_hash
from app.models.user import User
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def check_password_hashes(db: Session):
    """Veritabanındaki şifre hash'lerini kontrol eder"""
    users = db.query(User).all()
    logger.info(f"Toplam {len(users)} kullanıcı kontrol ediliyor")
    
    for user in users:
        if not user.password_hash:
            logger.warning(f"Kullanıcı {user.email} (ID: {user.id}) şifre hash'i yok!")
            continue
            
        # Hash formatını kontrol et
        try:
            valid_format = user.password_hash.startswith('$2')  # Bcrypt formatı
            logger.info(f"Kullanıcı {user.email} - Hash formatı geçerli: {valid_format}")
            
            if not valid_format:
                logger.warning(f"Kullanıcı {user.email} - Geçersiz hash formatı: {user.password_hash[:10]}...")
        except Exception as e:
            logger.error(f"Kullanıcı {user.email} - Hash kontrolü hatası: {str(e)}")

def reset_specific_user_password(db: Session, email: str, new_password: str):
    """Belirli bir kullanıcının şifresini sıfırlar"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        logger.error(f"Kullanıcı bulunamadı: {email}")
        return False
        
    try:
        # Yeni şifre hash'i
        new_hash = get_password_hash(new_password)
        logger.info(f"Eski hash: {user.password_hash[:20]}...")
        logger.info(f"Yeni hash: {new_hash[:20]}...")
        
        # Hash'i güncelle
        user.password_hash = new_hash
        db.commit()
        logger.info(f"Kullanıcı {email} şifresi başarıyla sıfırlandı")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Şifre sıfırlama hatası: {str(e)}")
        return False

def manual_auth_check(db: Session, email: str, password: str):
    """Manuel şifre doğrulama testi"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        logger.error(f"Kullanıcı bulunamadı: {email}")
        return False
        
    try:
        # Hash bilgisini göster
        logger.info(f"Hash uzunluğu: {len(user.password_hash)}")
        logger.info(f"Hash örneği: {user.password_hash[:20]}...")
        
        # Manuel doğrulama
        result = pwd_context.verify(password, user.password_hash)
        logger.info(f"Doğrulama sonucu: {result}")
        return result
    except Exception as e:
        logger.error(f"Doğrulama hatası: {str(e)}")
        return False

if __name__ == "__main__":
    db = SessionLocal()
    try:
        # Tüm şifreleri kontrol et
        check_password_hashes(db)
        
        # Test: Manuel kimlik doğrulama
        email = "firat@the-leadlab.com"
        password = "147741_a"
        auth_result = manual_auth_check(db, email, password)
        print(f"Manuel doğrulama sonucu: {'Başarılı' if auth_result else 'Başarısız'}")
        
        # İsteğe bağlı: Şifre sıfırlama
        # Bu kısmı açmadan önce dikkatli olun! Sadece ihtiyaç duyulduğunda çalıştırın
        # reset_result = reset_specific_user_password(db, email, password)
        # print(f"Şifre sıfırlama sonucu: {'Başarılı' if reset_result else 'Başarısız'}")
    finally:
        db.close() 