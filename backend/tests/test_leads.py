import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.lead import Lead
from app.models.user import User
from app.models.token import Token
from app.services.lead_service import LeadService
from decimal import Decimal

def test_create_lead(client: TestClient, db: Session, test_user: dict):
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
    
    # Lead oluştur
    headers = {"Authorization": f"Bearer {token}"}
    lead_data = {
        "firstname": "John",
        "lastname": "Doe",
        "company": "Test Company",
        "job_title": "CEO",
        "location": "Istanbul",
        "sector": "Technology",
        "email": "john@testcompany.com",
        "mobile": "+905551234567"
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/leads/",
        headers=headers,
        json=lead_data
    )
    assert response.status_code == 200
    
    # Lead'i kontrol et
    lead = response.json()
    assert lead["firstname"] == lead_data["firstname"]
    assert lead["lastname"] == lead_data["lastname"]
    assert lead["company"] == lead_data["company"]
    
    # Public alanları kontrol et
    assert "email" not in lead
    assert "mobile" not in lead
    
def test_purchase_lead_data(client: TestClient, db: Session, test_user: dict):
    # Token bakiyesi ekle
    user = db.query(User).filter(User.email == test_user["email"]).first()
    token = Token(user_id=user.id, balance=Decimal("10.00"))
    db.add(token)
    db.commit()
    
    # Login ol
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200
    access_token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Lead'i bul
    lead = db.query(Lead).first()
    assert lead is not None
    
    # Email verisi satın al
    response = client.post(
        f"{settings.API_V1_STR}/leads/{lead.id}/purchase/email",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert data["email"] == "john@testcompany.com"
    
    # Token bakiyesini kontrol et
    token = db.query(Token).filter(Token.user_id == user.id).first()
    assert token.balance == Decimal("9.60")  # 10.00 - 0.40
    
def test_list_leads(client: TestClient, db: Session, test_user: dict):
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
    
    # Lead'leri listele
    response = client.get(
        f"{settings.API_V1_STR}/leads/",
        headers=headers
    )
    assert response.status_code == 200
    leads = response.json()
    assert len(leads) > 0
    
    # Filtrelerle listele
    response = client.get(
        f"{settings.API_V1_STR}/leads/?sector=Technology",
        headers=headers
    )
    assert response.status_code == 200
    leads = response.json()
    assert len(leads) > 0
    assert all(lead["sector"] == "Technology" for lead in leads)
    
def test_get_lead_details(client: TestClient, db: Session, test_user: dict):
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
    
    # Lead'i bul
    lead = db.query(Lead).first()
    assert lead is not None
    
    # Lead detaylarını getir
    response = client.get(
        f"{settings.API_V1_STR}/leads/{lead.id}",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    
    # Public alanları kontrol et
    assert data["firstname"] == lead.firstname
    assert data["lastname"] == lead.lastname
    assert data["company"] == lead.company
    
    # Satın alınmış alanları kontrol et
    assert "email" in data  # Email satın alınmıştı
    assert "mobile" not in data  # Mobile satın alınmamıştı
