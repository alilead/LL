from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import time
from app.monitoring.logger import logger
from app.monitoring.loki import loki_logger
from app.monitoring.metrics import metrics_logger
import psutil

class MonitoringMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Request başlangıç zamanı
        start_time = time.time()
        
        # Request path ve method
        path = request.url.path
        method = request.method
        
        try:
            # Response'u al
            response = await call_next(request)
            
            # İşlem süresini hesapla
            process_time = time.time() - start_time
            
            # Request verilerini hazırla
            request_data = {
                'endpoint': path,
                'method': method,
                'status_code': response.status_code,
                'ip': request.client.host if request.client else None,
                'user_id': getattr(request.state, 'user_id', None)
            }
            
            # Local logging
            logger.log_access(request_data)
            logger.log_performance(
                endpoint=path,
                execution_time=process_time
            )
            
            # Grafana Loki logging
            await loki_logger.log_access(request_data)
            await loki_logger.log_performance(
                endpoint=path,
                execution_time=process_time,
                context=request_data
            )
            
            # Prometheus metrics
            metrics_logger.log_request(
                method=method,
                endpoint=path,
                status=response.status_code,
                duration=process_time
            )
            
            # System metrics
            memory = psutil.Process().memory_info().rss
            cpu_percent = psutil.Process().cpu_percent()
            metrics_logger.set_system_metrics(memory, cpu_percent)
            
            return response
            
        except Exception as e:
            # İşlem süresini hesapla
            process_time = time.time() - start_time
            
            # Hata context'ini hazırla
            error_context = {
                'endpoint': path,
                'method': method,
                'execution_time': process_time,
                'ip': request.client.host if request.client else None,
                'user_id': getattr(request.state, 'user_id', None)
            }
            
            # Local logging
            logger.log_error(e, error_context)
            
            # Grafana Loki logging
            await loki_logger.log_error(e, error_context)
            
            # Prometheus metrics - error case
            metrics_logger.log_request(
                method=method,
                endpoint=path,
                status=500,
                duration=process_time
            )
            
            raise