import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.security import get_password_hash
from app.models.organization import Organization
from app.models.role import Role, Permission
from app.models.user import User
from app.models.lead import Lead
from app.models.task import Task
from app.models.note import Note
from app.models.activity import Activity

def test_create_organization(client: TestClient, db: Session):
    # Test organizasyon oluşturma
    org_data = {
        "name": "Test Organization",
        "description": "Test Description",
        "website": "https://test.com"
    }
    
    response = client.post("/api/v1/organizations/", json=org_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == org_data["name"]
    return data["id"]

def test_create_roles(client: TestClient, db: Session, org_id: int):
    # Test rolleri oluşturma
    roles_data = [
        {"name": "admin", "description": "Administrator"},
        {"name": "manager", "description": "Manager"},
        {"name": "user", "description": "Normal User"}
    ]
    
    role_ids = []
    for role_data in roles_data:
        role_data["organization_id"] = org_id
        response = client.post("/api/v1/roles/", json=role_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == role_data["name"]
        role_ids.append(data["id"])
    
    return role_ids

def test_create_users(client: TestClient, db: Session, org_id: int, role_ids: list):
    # Test kullanıcıları oluşturma
    users_data = [
        {
            "email": "admin@test.com",
            "password": "admin123",
            "first_name": "Admin",
            "last_name": "User",
            "role_id": role_ids[0]  # admin role
        },
        {
            "email": "manager@test.com",
            "password": "manager123",
            "first_name": "Manager",
            "last_name": "User",
            "role_id": role_ids[1]  # manager role
        }
    ]
    
    user_ids = []
    for user_data in users_data:
        user_data["organization_id"] = org_id
        response = client.post("/api/v1/users/", json=user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_data["email"]
        user_ids.append(data["id"])
    
    return user_ids

def test_create_lead(client: TestClient, db: Session, org_id: int, user_ids: list):
    # Test lead oluşturma
    lead_data = {
        "title": "Test Lead",
        "description": "Test Lead Description",
        "organization_id": org_id,
        "user_id": user_ids[0],  # admin user
        "stage": "new",
        "priority": "high"
    }
    
    response = client.post("/api/v1/leads/", json=lead_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == lead_data["title"]
    return data["id"]

def test_create_task(client: TestClient, db: Session, lead_id: int, user_ids: list):
    # Test görev oluşturma
    task_data = {
        "title": "Test Task",
        "description": "Test Task Description",
        "lead_id": lead_id,
        "user_id": user_ids[1],  # manager user
        "due_date": datetime.utcnow().isoformat(),
        "priority": "high",
        "status": "todo"
    }
    
    response = client.post("/api/v1/tasks/", json=task_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == task_data["title"]

def test_create_note(client: TestClient, db: Session, lead_id: int, user_ids: list):
    # Test not oluşturma
    note_data = {
        "content": "Test Note Content",
        "lead_id": lead_id,
        "user_id": user_ids[0]  # admin user
    }
    
    response = client.post("/api/v1/notes/", json=note_data)
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == note_data["content"]

def test_create_activity(client: TestClient, db: Session, lead_id: int, user_ids: list):
    # Test aktivite oluşturma
    activity_data = {
        "type": "call",
        "description": "Test Call Activity",
        "lead_id": lead_id,
        "user_id": user_ids[1]  # manager user
    }
    
    response = client.post("/api/v1/activities/", json=activity_data)
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == activity_data["type"]

def test_get_lead_details(client: TestClient, db: Session, lead_id: int):
    # Test lead detaylarını alma
    response = client.get(f"/api/v1/leads/{lead_id}")
    assert response.status_code == 200
    data = response.json()
    
    # Lead bilgilerini kontrol et
    assert data["id"] == lead_id
    assert "title" in data
    assert "description" in data
    assert "stage" in data
    assert "priority" in data
    
    # İlişkili verileri kontrol et
    assert "tasks" in data
    assert len(data["tasks"]) > 0
    assert "notes" in data
    assert len(data["notes"]) > 0
    assert "activities" in data
    assert len(data["activities"]) > 0

def test_update_lead(client: TestClient, db: Session, lead_id: int):
    # Test lead güncelleme
    update_data = {
        "stage": "qualified",
        "priority": "medium"
    }
    
    response = client.patch(f"/api/v1/leads/{lead_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["stage"] == update_data["stage"]
    assert data["priority"] == update_data["priority"]

def test_delete_lead(client: TestClient, db: Session, lead_id: int):
    # Test lead silme
    response = client.delete(f"/api/v1/leads/{lead_id}")
    assert response.status_code == 200
    
    # Lead'in silindiğini kontrol et
    response = client.get(f"/api/v1/leads/{lead_id}")
    assert response.status_code == 404
