import logging
import json
import sys
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler
from app.core.config import settings

# Log format
class JsonFormatter(logging.Formatter):
    def format(self, record):
        # Basic log information
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "env": "development" if settings.DEBUG else "production"
        }

        # Extra information
        if hasattr(record, "extra"):
            log_data.update(record.extra)

        # Exception information
        if record.exc_info:
            log_data["exception"] = {
                "type": str(record.exc_info[0].__name__),
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info)
            }
            
        return json.dumps(log_data, ensure_ascii=False)

# Create logger and set basic configuration
logger = logging.getLogger("leadlab")
logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

# Always add console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(JsonFormatter())
logger.addHandler(console_handler)

# In production, also write to file
if not settings.DEBUG:
    try:
        # Log directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        log_dir = os.path.join(base_dir, "logs")
        os.makedirs(log_dir, exist_ok=True)

        # Rotating file handler
        file_handler = RotatingFileHandler(
            filename=os.path.join(log_dir, "app.log"),
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setFormatter(JsonFormatter())
        logger.addHandler(file_handler)
        logger.info(f"File logging enabled at: {log_dir}")
    except Exception as e:
        logger.warning(f"Failed to setup file logging: {str(e)}")
