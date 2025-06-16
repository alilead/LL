#!/usr/bin/env python3
"""
Veritabanı bağlantı testi 
"""
from sqlalchemy import create_engine, text
from app.core.config import settings
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_db_connection():
    try:
        # Konfigürasyon bilgilerini göster 
        logger.info(f"Veritabanı URL: {settings.DATABASE_URL}")
        
        # Veritabanı bağlantısı kur
        logger.info("Veritabanına bağlanılıyor...")
        engine = create_engine(settings.DATABASE_URL)
        
        # Bağlantıyı test et
        logger.info("Bağlantı test ediliyor...")
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            logger.info(f"Sorgu sonucu: {result.fetchone()}")
            
            # Kullanıcıları sorgula
            user_result = connection.execute(text("SELECT COUNT(*) FROM users"))
            user_count = user_result.fetchone()[0]
            logger.info(f"Sistemde {user_count} kullanıcı var")
            
            # Kullanıcı bilgilerini sorgula
            test_email = "firat@the-leadlab.com"
            user_detail = connection.execute(
                text("SELECT id, email, first_name, last_name FROM users WHERE email = :email"),
                {"email": test_email}
            ).fetchone()
            
            if user_detail:
                logger.info(f"Test kullanıcısı bulundu: {user_detail}")
            else:
                logger.warning(f"Test kullanıcısı bulunamadı: {test_email}")
        
        logger.info("Veritabanı bağlantısı başarılı!")
        return True, "Veritabanı bağlantısı başarılı"
        
    except Exception as e:
        logger.error(f"Veritabanı bağlantı hatası: {str(e)}")
        return False, f"Database connection failed: {str(e)}"

if __name__ == "__main__":
    success, message = test_db_connection()
    print(message) 