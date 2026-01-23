import logging
import json
import os
import time
from datetime import datetime
from typing import Dict, Any, Optional
from functools import wraps
from pathlib import Path

class CustomLogger:
    def __init__(self):
        # Log dizini oluştur
        self.log_dir = Path("logs")
        self.log_dir.mkdir(exist_ok=True)
        
        # Error log
        self.error_logger = logging.getLogger('error_logger')
        error_handler = logging.FileHandler(self.log_dir / 'error.log')
        error_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        ))
        self.error_logger.addHandler(error_handler)
        self.error_logger.setLevel(logging.ERROR)
        
        # Access log
        self.access_logger = logging.getLogger('access_logger')
        access_handler = logging.FileHandler(self.log_dir / 'access.log')
        access_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(message)s'
        ))
        self.access_logger.addHandler(access_handler)
        self.access_logger.setLevel(logging.INFO)
        
        # Performance log
        self.perf_logger = logging.getLogger('performance_logger')
        perf_handler = logging.FileHandler(self.log_dir / 'performance.log')
        perf_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(message)s'
        ))
        self.perf_logger.addHandler(perf_handler)
        self.perf_logger.setLevel(logging.INFO)

    def log_error(self, error: Exception, context: Optional[Dict[str, Any]] = None):
        """Hata logları için"""
        error_data = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'context': context or {},
            'timestamp': datetime.now().isoformat()
        }
        self.error_logger.error(json.dumps(error_data))

    def log_access(self, request_data: Dict[str, Any]):
        """API erişim logları için"""
        access_data = {
            'endpoint': request_data.get('endpoint'),
            'method': request_data.get('method'),
            'user_id': request_data.get('user_id'),
            'ip': request_data.get('ip'),
            'status_code': request_data.get('status_code'),
            'timestamp': datetime.now().isoformat()
        }
        self.access_logger.info(json.dumps(access_data))

    def log_performance(self, endpoint: str, execution_time: float, context: Optional[Dict[str, Any]] = None):
        """Performans metrikleri için"""
        perf_data = {
            'endpoint': endpoint,
            'execution_time': execution_time,
            'context': context or {},
            'timestamp': datetime.now().isoformat()
        }
        self.perf_logger.info(json.dumps(perf_data))

    def monitor_performance(self, endpoint: str):
        """Endpoint performans decorator'ı"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    execution_time = time.time() - start_time
                    self.log_performance(endpoint, execution_time)
                    return result
                except Exception as e:
                    execution_time = time.time() - start_time
                    self.log_performance(endpoint, execution_time, {'error': str(e)})
                    raise
            return wrapper
        return decorator

# Global logger instance
logger = CustomLogger()
