import pytest
from typing import Generator, Dict
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base import Base
from main import app
from app.api.deps import get_db

# Test database URL
TEST_DATABASE_URL = "mysql+pymysql://httpdvic1_test:JVI~dEtn6#gs@localhost:3306/httpdvic1_test"

# Test database engine
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db() -> Generator:
    # Database oluştur
    Base.metadata.create_all(bind=engine)
    
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()
        # Test database'ini temizle
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client() -> Generator:
    # Test client oluştur
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def test_user() -> Dict[str, str]:
    return {
        "email": "test@the-leadlab.com",
        "username": "testuser",
        "password": "test123",
        "first_name": "Test",
        "last_name": "User"
    }

@pytest.fixture(scope="module")
def test_admin() -> Dict[str, str]:
    return {
        "email": "admin@the-leadlab.com",
        "username": "admin",
        "password": "admin123",
        "first_name": "Admin",
        "last_name": "User",
        "is_admin": True
    }

@pytest.fixture(scope="module")
def test_lead() -> Dict[str, str]:
    return {
        "firstname": "John",
        "lastname": "Doe",
        "company": "Test Company",
        "job_title": "CEO",
        "location": "Istanbul",
        "sector": "Technology",
        "email": "john@testcompany.com",
        "mobile": "+905551234567"
    }
