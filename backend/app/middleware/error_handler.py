from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import SQLAlchemyError
from pymysql.err import MySQLError
from redis.exceptions import RedisError
import traceback
import sentry_sdk
from app.core.config import settings
from app.utils.logger import logger

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            # İsteği işle
            response = await call_next(request)
            return response
            
        except SQLAlchemyError as e:
            # Veritabanı hataları
            logger.error(f"Database error: {str(e)}\n{traceback.format_exc()}")
            sentry_sdk.capture_exception(e)
            return JSONResponse(
                status_code=503,
                content={
                    "error": "database_error",
                    "message": "Database operation failed"
                }
            )
            
        except MySQLError as e:
            # MySQL özel hataları
            logger.error(f"MySQL error: {str(e)}\n{traceback.format_exc()}")
            sentry_sdk.capture_exception(e)
            return JSONResponse(
                status_code=503,
                content={
                    "error": "mysql_error",
                    "message": "MySQL operation failed"
                }
            )
            
        except RedisError as e:
            # Redis hataları
            logger.error(f"Redis error: {str(e)}\n{traceback.format_exc()}")
            sentry_sdk.capture_exception(e)
            return JSONResponse(
                status_code=503,
                content={
                    "error": "redis_error",
                    "message": "Cache operation failed"
                }
            )
            
        except Exception as e:
            # Genel hatalar
            logger.error(f"Unhandled error: {str(e)}\n{traceback.format_exc()}")
            sentry_sdk.capture_exception(e)
            
            # Debug modunda detaylı hata göster
            if settings.APP_DEBUG:
                return JSONResponse(
                    status_code=500,
                    content={
                        "error": "internal_server_error",
                        "message": str(e),
                        "traceback": traceback.format_exc()
                    }
                )
            
            # Production'da genel hata mesajı
            return JSONResponse(
                status_code=500,
                content={
                    "error": "internal_server_error",
                    "message": "An unexpected error occurred"
                }
            )