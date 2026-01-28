from pydantic import BaseSettings

class HostingSettings(BaseSettings):
    # Server Resource Limits
    MAX_CPU_CORES: int = 4
    MAX_MEMORY_GB: int = 8
    IO_SPEED_MBS: int = 80
    MAX_INODES: int = 250000
    
    # Database Configuration
    DB_VERSION: str = "8.0.31"
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_MAX_CONNECTIONS: int = 100
    
    # Email Configuration
    SMTP_PATH: str = "/usr/sbin/sendmail"
    MAX_HOURLY_EMAILS: int = 200
    MAX_EMAIL_SIZE_MB: int = 2048
    
    # Web Server Settings
    APACHE_VERSION: str = "2.4.54"
    ENABLE_LITESPEED: bool = True
    ENABLE_CLOUDFLARE: bool = True
    SSL_ENABLED: bool = True
    
    # Cache Configuration
    ENABLE_MEMCACHED: bool = True
    ENABLE_LSCACHE: bool = True
    
    class Config:
        case_sensitive = True 