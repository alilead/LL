from pydantic_settings import BaseSettings
from typing import List, Optional, Union
import json
from pydantic import Field, field_validator, AnyHttpUrl, ConfigDict
import os

class Settings(BaseSettings):
    # Environment
    ENV: str = Field(default="development", description="Current environment (development/production)")
    
    # Application
    PROJECT_NAME: str = Field(default="LeadLab API", description="Project name")
    VERSION: str = Field(default="1.0.0", description="API version")
    API_V1_STR: str = Field(default="/api/v1", description="API version prefix")
    DEBUG: bool = Field(default=False, description="Debug mode")
    SECRET_KEY: str = Field(default="leadlab-secret-key-2024", description="Secret key for JWT encoding")
    FRONTEND_URL: str = Field(default="https://the-leadlab.com", description="Frontend application URL")
    
    # Database
    DATABASE_URL: str = Field(default="mysql+pymysql://httpdvic1_admin:JVI~dEtn6#gs@localhost/leadlab?charset=utf8mb4", description="Database connection URL")
    MYSQL_POOL_SIZE: int = Field(default=5, description="MySQL connection pool size")
    MYSQL_MAX_OVERFLOW: int = Field(default=2, description="MySQL connection pool max overflow")
    MYSQL_POOL_TIMEOUT: int = Field(default=30, description="MySQL connection pool timeout")
    MYSQL_POOL_RECYCLE: int = Field(default=300, description="MySQL connection pool recycle time in seconds")
    
    # Security
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24, description="Access token expiry in minutes")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiry in days")
    TOKEN_ENCRYPTION_KEY: str = Field(default="d-bObG__j-IynTqhD-eatflCbGnbb3Kqzi8xmb_2HQ8=", description="Key used for encrypting tokens")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=[
            "https://www.the-leadlab.com",
            "https://the-leadlab.com",
            "https://api.the-leadlab.com"
        ],
        description="List of allowed origins for CORS"
    )
    CORS_ALLOW_CREDENTIALS: bool = Field(default=True, description="Allow credentials for CORS")
    CORS_METHODS: List[str] = Field(
        default=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
        description="Allowed HTTP methods for CORS"
    )
    CORS_HEADERS: List[str] = Field(
        default=[
            "Content-Type",
            "Accept",
            "Authorization",
            "Origin",
            "X-Requested-With",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers"
        ],
        description="Allowed HTTP headers for CORS"
    )
    
    # API Keys
    API_SECRET_KEY: str = Field(default="leadlab-api-secret-2024", description="API secret key")
    CRYSTAL_KNOWS_API_KEY: Optional[str] = Field(default=None, description="Crystal Knows API key")
    CRYSTAL_KNOWS_BASE_URL: Optional[str] = Field(
        default="https://api.crystalknows.com/v1",
        description="Crystal Knows API base URL"
    )

    # LinkedIn Configuration
    LINKEDIN_CLIENT_ID: str = Field(default="77ndp90oa63xyn", description="LinkedIn client ID")
    LINKEDIN_CLIENT_SECRET: str = Field(default="WPL_AP1.kNDMX6fD1YaEA4oo.qGm/LQ==", description="LinkedIn client secret")
    LINKEDIN_REDIRECT_URI: str = Field(default="http://localhost:3000/linkedin/callback", description="LinkedIn redirect URI")
    LINKEDIN_SCOPE: str = Field(default="openid profile email w_member_social", description="LinkedIn OAuth scope")
    
    @field_validator("LINKEDIN_CLIENT_SECRET", mode="before")
    def clean_linkedin_secret(cls, v: str) -> str:
        """Handle LinkedIn client secret format."""
        if not isinstance(v, str):
            return v
            
        # Keep the client secret as is, including any prefix or suffix
        return v

    # Stripe Configuration
    STRIPE_PUBLISHABLE_KEY: str = Field(default="pk_test_51Po9pFGAwS5JrvA5DqSMFXh2iccm5zAOQ6oWGXet6aycxKUxiQPQIpmCj32H2STSGVNLvbf04FtiQXy9r8XL0Edz00I3YVnmnH", description="Stripe publishable key")
    STRIPE_SECRET_KEY: str = Field(default="sk_test_51Po9pFGAwS5JrvA5Qa3ihQXCKRn305tCrusJJHqXExghCpYlkyzhCmOpH1CVLCIt9rCHgCYSG7BVtXd2puzRHavq00exEeNX4l", description="Stripe secret key")
    STRIPE_WEBHOOK_SECRET: str = Field(default="whsec_51PoaqzHhYzNfGDxGwzO1ujGbN8HMbYY", description="Stripe webhook secret")
    STRIPE_CURRENCY: str = Field(default="usd", description="Default currency for Stripe payments")
    
    # Email/SMTP Configuration
    SMTP_HOST: str = Field(default="the-leadlab.com", description="SMTP server host")
    SMTP_PORT: int = Field(default=465, description="SMTP server port")
    SMTP_USER: Optional[str] = Field(default="no-reply@the-leadlab.com", description="SMTP username")
    SMTP_PASSWORD: Optional[str] = Field(default="^O3f35rm2", description="SMTP password")
    SMTP_TLS: bool = Field(default=True, description="Use TLS for SMTP")
    EMAILS_FROM_EMAIL: str = Field(default="no-reply@the-leadlab.com", description="Default from email")
    SMTP_FROM_NAME: str = Field(default="LeadLab", description="Default from name")
    
    # Invoice Email Configuration (separate from auth emails)
    INVOICE_EMAIL: str = Field(default="invoice@the-leadlab.com", description="Invoice-specific email")
    INVOICE_EMAIL_PASSWORD: str = Field(default="oq96tJ2~7", description="Invoice email password")
    
    # Email Token Configuration
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = Field(default=1, description="Password reset token expiry in hours")
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = Field(default=24, description="Email verification token expiry in hours")
    
    # File upload settings
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    def parse_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        return v

# Settings instance
settings = Settings()