#!/usr/bin/env python3
"""
Veritabanı sağlık kontrolü ve bağlantı testi
"""
from sqlalchemy import text
from app.database import engine, SessionLocal
import time
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def check_db_connection():
    """Veritabanı bağlantısını test eder ve performans metriklerini raporlar"""
    try:
        # Direkt engine bağlantısı kontrolü
        logger.info("Engine bağlantısı test ediliyor...")
        start_time = time.time()
        connection = engine.connect()
        connect_time = time.time() - start_time
        logger.info(f"Engine bağlantı süresi: {connect_time:.4f} saniye")
        
        # Basit sorgu testi
        start_time = time.time()
        result = connection.execute(text("SELECT 1"))
        query_time = time.time() - start_time
        logger.info(f"Basit sorgu süresi: {query_time:.4f} saniye")
        connection.close()
        
        # Session kullanarak test
        logger.info("Session oluşturuluyor...")
        start_time = time.time()
        db = SessionLocal()
        session_time = time.time() - start_time
        logger.info(f"Session oluşturma süresi: {session_time:.4f} saniye")
        
        # Kullanıcı tablosu sorgusu
        start_time = time.time()
        user_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
        users_query_time = time.time() - start_time
        logger.info(f"Kullanıcı sayısı sorgu süresi: {users_query_time:.4f} saniye, Toplam: {user_count} kullanıcı")
        
        # Özet rapor
        logger.info("=== Veritabanı Bağlantı Testi Sonuçları ===")
        logger.info(f"Engine bağlantı süresi: {connect_time:.4f} saniye")
        logger.info(f"Basit sorgu süresi: {query_time:.4f} saniye")
        logger.info(f"Session oluşturma süresi: {session_time:.4f} saniye")
        logger.info(f"Kullanıcı sorgu süresi: {users_query_time:.4f} saniye")
        logger.info(f"Toplam süre: {connect_time + query_time + session_time + users_query_time:.4f} saniye")
        
        return True, "Veritabanı bağlantısı başarılı"
    except Exception as e:
        logger.error(f"Veritabanı bağlantı hatası: {str(e)}")
        return False, f"Veritabanı hatası: {str(e)}"
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    success, message = check_db_connection()
    print(f"Sonuç: {'Başarılı' if success else 'Başarısız'} - {message}") 