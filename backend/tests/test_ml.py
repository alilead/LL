import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.lead import Lead
from app.models.user import User
from app.ml.personality_predictor import PersonalityPredictor

def test_predict_personality(client: TestClient, db: Session, test_user: dict, test_lead: dict):
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
    
    # Lead oluştur
    response = client.post(
        f"{settings.API_V1_STR}/leads/",
        headers=headers,
        json=test_lead
    )
    assert response.status_code == 200
    lead_id = response.json()["id"]
    
    # Perform personality analysis
    response = client.post(
        f"{settings.API_V1_STR}/ml/predict/{lead_id}",
        headers=headers
    )
    assert response.status_code == 200
    prediction = response.json()
    
    # Sonuçları kontrol et
    assert "personality_type" in prediction
    assert "communication_style" in prediction
    assert "decision_making" in prediction
    assert "leadership_style" in prediction
    assert "motivation_factors" in prediction
    assert "work_preferences" in prediction
    assert "team_dynamics" in prediction
    assert "strengths" in prediction
    assert "challenges" in prediction
    
def test_batch_predict(client: TestClient, db: Session, test_user: dict):
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
    
    # Lead'leri al
    response = client.get(
        f"{settings.API_V1_STR}/leads/",
        headers=headers
    )
    assert response.status_code == 200
    leads = response.json()
    lead_ids = [lead["id"] for lead in leads]
    
    # Toplu tahmin yap
    response = client.post(
        f"{settings.API_V1_STR}/ml/batch-predict",
        headers=headers,
        json={"lead_ids": lead_ids}
    )
    assert response.status_code == 200
    predictions = response.json()
    
    # Her lead için sonuçları kontrol et
    for lead_id, prediction in predictions.items():
        assert "personality_type" in prediction
        assert "communication_style" in prediction
        assert "decision_making" in prediction
        
def test_model_performance(client: TestClient, db: Session, test_user: dict):
    # Admin kullanıcısı oluştur
    admin_user = {
        "email": "admin@the-leadlab.com",
        "username": "admin",
        "password": "admin123",
        "is_admin": True
    }
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=admin_user
    )
    assert response.status_code == 200
    
    # Admin olarak login ol
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": admin_user["email"],
            "password": admin_user["password"]
        }
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Model performansını kontrol et
    response = client.get(
        f"{settings.API_V1_STR}/ml/performance",
        headers=headers
    )
    assert response.status_code == 200
    performance = response.json()
    
    # Metrikleri kontrol et
    assert "accuracy" in performance
    assert "precision" in performance
    assert "recall" in performance
    assert "f1_score" in performance
    assert "confusion_matrix" in performance
    
def test_model_retraining(client: TestClient, db: Session, test_user: dict):
    # Admin olarak login ol
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": "admin@the-leadlab.com",
            "password": "admin123"
        }
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Model'i yeniden eğit
    response = client.post(
        f"{settings.API_V1_STR}/ml/retrain",
        headers=headers
    )
    assert response.status_code == 200
    result = response.json()
    
    # Eğitim sonuçlarını kontrol et
    assert "status" in result
    assert result["status"] == "success"
    assert "metrics" in result
    assert "training_time" in result
    assert "model_version" in result
