import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User
from app.models.token import Token
from app.models.transaction import Transaction
from decimal import Decimal

def test_get_token_balance(client: TestClient, db: Session, test_user: dict):
    # Kullanıcı oluştur
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=test_user
    )
    assert response.status_code == 200
    
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
    
    # Token bakiyesi kontrol et
    response = client.get(
        f"{settings.API_V1_STR}/tokens/balance",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "balance" in data
    assert data["balance"] == 0
    
def test_purchase_tokens(client: TestClient, db: Session, test_user: dict):
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
    
    # Token satın al
    response = client.post(
        f"{settings.API_V1_STR}/tokens/purchase",
        headers=headers,
        json={"amount": 50}  # Basic paket
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 50
    assert data["new_balance"] == 50
    
    # Token bakiyesini kontrol et
    user = db.query(User).filter(User.email == test_user["email"]).first()
    token = db.query(Token).filter(Token.user_id == user.id).first()
    assert token.balance == Decimal("50.00")
    
def test_token_history(client: TestClient, db: Session, test_user: dict):
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
    
    # İşlem geçmişini kontrol et
    response = client.get(
        f"{settings.API_V1_STR}/tokens/history",
        headers=headers
    )
    assert response.status_code == 200
    history = response.json()
    assert len(history) > 0
    
    # Son işlemi kontrol et
    last_transaction = history[0]
    assert last_transaction["type"] == "PURCHASE"
    assert last_transaction["amount"] == 50
    
def test_token_prices(client: TestClient):
    # Token paket fiyatlarını kontrol et
    response = client.get(f"{settings.API_V1_STR}/tokens/prices")
    assert response.status_code == 200
    prices = response.json()
    
    assert "basic" in prices
    assert prices["basic"] == 50
    assert "pro" in prices
    assert prices["pro"] == 100
    assert "enterprise" in prices
    assert prices["enterprise"] == 500
