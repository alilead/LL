from pydantic import BaseSettings
from typing import Dict, Any

class DatabaseSettings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "httpdvic1_admin"
    DB_PASSWORD: str = "JVI~dEtn6#gs"
    DB_NAME: str = "leadlabv2"
    
    # cPanel Production Settings
    MYSQL_CONFIG: Dict[str, Any] = {
        "pool_size": 5,  # Reduced for shared hosting
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
        "connect_args": {
            "charset": "utf8mb4",
            "use_unicode": True,
            "connect_timeout": 30,
            "read_timeout": 30,
            "write_timeout": 30,
            "sql_mode": "STRICT_TRANS_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO",
            "init_command": "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        }
    }

    # cPanel Resource Limits
    CPANEL_LIMITS: Dict[str, Any] = {
        "max_connections": 20,
        "max_user_connections": 5,
        "wait_timeout": 60,
        "interactive_timeout": 180
    }
    
    # Backup Configuration
    BACKUP_CONFIG: Dict[str, Any] = {
        "backup_time": time(hour=3, minute=0),  # 03:00 AM
        "backup_retention_days": 7,
        "compression": True,
        "backup_path": "/home/httpdvic1/backups",
        "max_backup_size_mb": 500
    }
    
    # Table Maintenance
    TABLE_MAINTENANCE: Dict[str, Any] = {
        "analyze_frequency_hours": 24,
        "optimize_threshold_mb": 100,
        "max_slow_queries": 50,
        "temporary_table_size": "64M"
    }

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        case_sensitive = True