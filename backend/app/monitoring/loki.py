import httpx
import json
from typing import Dict, Any
from datetime import datetime
import time
from app.core.config import settings

class LokiLogger:
    def __init__(self):
        self.url = "https://logs-prod-011.grafana.net/loki/api/v1/push"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.GRAFANA_API_KEY}"
        }
        
    async def send_log(self, labels: Dict[str, str], message: Dict[str, Any]):
        """Send log to Grafana Loki"""
        try:
            # Convert message to string if it's a dict
            if isinstance(message, dict):
                message = json.dumps(message)
                
            # Create Loki-compatible timestamp (nanoseconds)
            timestamp = str(int(time.time() * 1e9))
            
            # Prepare payload
            payload = {
                "streams": [
                    {
                        "stream": labels,
                        "values": [
                            [timestamp, message]
                        ]
                    }
                ]
            }
            
            # Send to Loki
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.url,
                    headers=self.headers,
                    json=payload,
                    timeout=5.0
                )
                response.raise_for_status()
                
        except Exception as e:
            print(f"Error sending log to Loki: {str(e)}")
            
    async def log_error(self, error: Exception, context: Dict[str, Any]):
        """Log error to Loki"""
        labels = {
            "level": "error",
            "app": "leadlab",
            "environment": settings.ENVIRONMENT
        }
        
        message = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context,
            "timestamp": datetime.now().isoformat()
        }
        
        await self.send_log(labels, message)
        
    async def log_access(self, request_data: Dict[str, Any]):
        """Log API access to Loki"""
        labels = {
            "level": "info",
            "app": "leadlab",
            "environment": settings.ENVIRONMENT,
            "component": "api"
        }
        
        await self.send_log(labels, request_data)
        
    async def log_performance(self, endpoint: str, execution_time: float, context: Dict[str, Any]):
        """Log performance metrics to Loki"""
        labels = {
            "level": "info",
            "app": "leadlab",
            "environment": settings.ENVIRONMENT,
            "component": "performance"
        }
        
        message = {
            "endpoint": endpoint,
            "execution_time": execution_time,
            "context": context,
            "timestamp": datetime.now().isoformat()
        }
        
        await self.send_log(labels, message)

# Global Loki logger instance
loki_logger = LokiLogger()
