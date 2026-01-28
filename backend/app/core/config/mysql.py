from pydantic import BaseSettings
from typing import Dict, Any

class MySQLSettings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "httpdvic1"
    DB_NAME: str = "leadlab_db"
    DB_PASSWORD: str = "your_password"
    
    # MySQL 8.0.31 Optimization Settings
    MYSQL_CONFIG: Dict[str, Any] = {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
        "sql_mode": "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION",
        "charset": "utf8mb4",
        "connect_timeout": 60,
        "echo": False
    }
    
    # InnoDB Settings
    INNODB_CONFIG: Dict[str, Any] = {
        "innodb_buffer_pool_size": "1G",
        "innodb_log_file_size": "256M",
        "innodb_flush_log_at_trx_commit": 1,
        "innodb_flush_method": "O_DIRECT"
    }
    
    class Config:
        case_sensitive = True