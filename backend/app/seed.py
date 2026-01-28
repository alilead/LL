from datetime import datetime, timedelta
import random
from sqlalchemy import text
from faker import Faker
from passlib.context import CryptContext
from app.database import SessionLocal

fake = Faker(['en_US'])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_db():
    db = SessionLocal()
    try:
        # Önce tüm tabloları temizle
        db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        db.execute(text("TRUNCATE TABLE activities"))
        db.execute(text("TRUNCATE TABLE notes"))
        db.execute(text("TRUNCATE TABLE tasks"))
        db.execute(text("TRUNCATE TABLE leads"))
        db.execute(text("TRUNCATE TABLE user_roles"))
        db.execute(text("TRUNCATE TABLE users"))
        db.execute(text("TRUNCATE TABLE roles"))
        db.execute(text("TRUNCATE TABLE organizations"))
        db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        db.commit()

        # Organizasyonları oluştur
        org = {
            "name": "Teknoloji A.Ş.",
            "description": "Yazılım geliştirme şirketi",
            "website": "https://teknoloji.com.tr",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = db.execute(
            text("""
                INSERT INTO organizations (name, description, website, is_active, created_at, updated_at)
                VALUES (:name, :description, :website, :is_active, :created_at, :updated_at)
            """),
            org
        )
        org_id = result.lastrowid

        # Rolleri oluştur
        roles = []
        for role_name in ["admin", "manager", "user"]:
            role = {
                "organization_id": org_id,
                "name": role_name,
                "description": f"{role_name.title()} role",
                "is_active": True,
                "is_system": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = db.execute(
                text("""
                    INSERT INTO roles (organization_id, name, description, is_active, is_system, created_at, updated_at)
                    VALUES (:organization_id, :name, :description, :is_active, :is_system, :created_at, :updated_at)
                """),
                role
            )
            roles.append({"id": result.lastrowid, "name": role_name})

        # Admin kullanıcısı
        admin_role = next(role for role in roles if role["name"] == "admin")
        admin = {
            "organization_id": org_id,
            "email": "admin@teknoloji.com.tr",
            "password_hash": pwd_context.hash("admin123"),
            "first_name": "Admin",
            "last_name": "User",
            "is_active": True,
            "is_superuser": True,
            "is_admin": True,
            "last_login": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = db.execute(
            text("""
                INSERT INTO users (organization_id, email, password_hash, first_name, last_name,
                                is_active, is_superuser, is_admin, last_login, created_at, updated_at)
                VALUES (:organization_id, :email, :password_hash, :first_name, :last_name,
                        :is_active, :is_superuser, :is_admin, :last_login, :created_at, :updated_at)
            """),
            admin
        )
        admin_id = result.lastrowid

        # Admin rolünü ekle
        db.execute(
            text("""
                INSERT INTO user_roles (user_id, role_id, created_at)
                VALUES (:user_id, :role_id, :created_at)
            """),
            {
                "user_id": admin_id,
                "role_id": admin_role["id"],
                "created_at": datetime.utcnow()
            }
        )

        # Normal kullanıcılar
        for i in range(5):
            user_role = next(role for role in roles if role["name"] == "user")
            user = {
                "organization_id": org_id,
                "email": f"user{i+1}@teknoloji.com.tr",
                "password_hash": pwd_context.hash("user123"),
                "first_name": fake.first_name(),
                "last_name": fake.last_name(),
                "is_active": True,
                "is_superuser": False,
                "is_admin": False,
                "last_login": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = db.execute(
                text("""
                    INSERT INTO users (organization_id, email, password_hash, first_name, last_name,
                                    is_active, is_superuser, is_admin, last_login, created_at, updated_at)
                    VALUES (:organization_id, :email, :password_hash, :first_name, :last_name,
                            :is_active, :is_superuser, :is_admin, :last_login, :created_at, :updated_at)
                """),
                user
            )
            user_id = result.lastrowid

            # Kullanıcı rolünü ekle
            db.execute(
                text("""
                    INSERT INTO user_roles (user_id, role_id, created_at)
                    VALUES (:user_id, :role_id, :created_at)
                """),
                {
                    "user_id": user_id,
                    "role_id": user_role["id"],
                    "created_at": datetime.utcnow()
                }
            )

        # Lead aşamalarını oluştur
        stages = [
            {"name": "Yeni", "description": "Yeni aşaması", "color": "#12bc5e", "order_index": 1},
            {"name": "İletişimde", "description": "İletişim kuruldu", "color": "#3498db", "order_index": 2},
            {"name": "Nitelikli", "description": "Nitelikli lead", "color": "#f1c40f", "order_index": 3},
            {"name": "Teklif", "description": "Teklif aşaması", "color": "#e67e22", "order_index": 4},
            {"name": "Kazanıldı", "description": "Kazanılan lead", "color": "#27ae60", "order_index": 5},
            {"name": "Kaybedildi", "description": "Kaybedilen lead", "color": "#e74c3c", "order_index": 6}
        ]
        
        stage_ids = []
        for stage in stages:
            result = db.execute(
                text("""
                    INSERT INTO lead_stages (name, description, color, order_index, is_active, created_at, updated_at)
                    VALUES (:name, :description, :color, :order_index, TRUE, :created_at, :updated_at)
                """),
                {
                    **stage,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            )
            stage_ids.append(result.lastrowid)

        # Test leadleri oluştur
        for i in range(20):
            lead = {
                "organization_id": org_id,
                "user_id": random.randint(1, 6),  # 1-6 arası rastgele kullanıcı
                "stage_id": random.choice(stage_ids),
                "first_name": fake.first_name(),
                "last_name": fake.last_name(),
                "email": fake.email(),
                "phone": fake.phone_number(),
                "company": fake.company(),
                "title": fake.job(),
                "source": "website",
                "description": fake.paragraph(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            db.execute(
                text("""
                    INSERT INTO leads (organization_id, user_id, stage_id, first_name, last_name,
                                    email, phone, company, title, source, description, created_at, updated_at)
                    VALUES (:organization_id, :user_id, :stage_id, :first_name, :last_name,
                            :email, :phone, :company, :title, :source, :description, :created_at, :updated_at)
                """),
                lead
            )

        db.commit()
        print("✅ Seed işlemi başarıyla tamamlandı!")

    except Exception as e:
        print("❌ Hata:", str(e))
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
