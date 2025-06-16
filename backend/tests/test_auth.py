import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User

def test_register(client: TestClient, db: Session, test_user: dict):
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=test_user
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]
    assert data["username"] == test_user["username"]
    assert "id" in data
    
    # Kullanıcıyı database'de kontrol et
    user = db.query(User).filter(User.email == test_user["email"]).first()
    assert user is not None
    assert user.email == test_user["email"]
    assert user.username == test_user["username"]
    assert user.is_active is True
    assert user.is_admin is False
    
def test_duplicate_register(client: TestClient, test_user: dict):
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=test_user
    )
    assert response.status_code == 400
    
def test_login(client: TestClient, test_user: dict):
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
    
def test_invalid_login(client: TestClient, test_user: dict):
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    
def test_me(client: TestClient, test_user: dict):
    # Login ol
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    # Kullanıcı bilgilerini getir
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]
    assert data["username"] == test_user["username"]
    
def test_change_password(client: TestClient, test_user: dict):
    # Login ol
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Şifre değiştir
    response = client.post(
        f"{settings.API_V1_STR}/auth/change-password",
        headers=headers,
        json={
            "current_password": test_user["password"],
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == 200
    
    # Yeni şifre ile giriş yap
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": "newpassword123"
        }
    )
    assert response.status_code == 200
    
def test_reset_password(client: TestClient, test_user: dict):
    # Şifre sıfırlama isteği gönder
    response = client.post(
        f"{settings.API_V1_STR}/auth/reset-password",
        json={"email": test_user["email"]}
    )
    assert response.status_code == 200
    
    # Token'ı database'den al
    user = db.query(User).filter(User.email == test_user["email"]).first()
    reset_token = user.reset_password_token
    
    # Yeni şifre belirle
    response = client.post(
        f"{settings.API_V1_STR}/auth/reset-password/{reset_token}",
        json={"new_password": "resetpassword123"}
    )
    assert response.status_code == 200
    
    # Yeni şifre ile giriş yap
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": "resetpassword123"
        }
    )
    assert response.status_code == 200
