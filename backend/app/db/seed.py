import sys
import os
from pathlib import Path
import random
from enum import Enum

# Add the parent directory to the Python path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(BACKEND_DIR)

# Set the .env file location
os.environ["ENV_FILE"] = os.path.join(BACKEND_DIR, ".env")

import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import crud
from app.schemas import (
    UserCreate,
    LeadCreate,
    DealCreate,
    TaskCreate,
    ActivityCreate,
    NoteCreate,
    TagCreate,
    LeadStageCreate,
    CurrencyCreate
)
from app.db.session import SessionLocal
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ActivityType(str, Enum):
    CALL = "CALL"

def create_initial_data(db: Session) -> None:
    try:
        # Create admin user
        admin_user = crud.crud_user.create(
            db,
            obj_in=UserCreate(
                email="admin@example.com",
                password="admin123",
                first_name="Admin",
                last_name="User",
                company="Octo Maslow",
                job_title="Administrator",
                is_admin=True,
                is_active=True
            )
        )
        logger.info("Created admin user")

        # Create regular user
        user1 = crud.crud_user.create(
            db,
            obj_in=UserCreate(
                email="user@example.com",
                password="user123",
                first_name="Regular",
                last_name="User",
                company="Octo Maslow",
                job_title="Sales Representative",
                is_admin=False,
                is_active=True
            )
        )
        logger.info("Created regular user")

        # Create currencies
        currencies = [
            ("USD", "US Dollar", "$"),
            ("EUR", "Euro", "€"),
            ("GBP", "British Pound", "£"),
            ("TRY", "Turkish Lira", "₺")
        ]
        
        created_currencies = []
        for code, name, symbol in currencies:
            currency = crud.crud_currency.create(
                db,
                obj_in=CurrencyCreate(
                    code=code,
                    name=name,
                    symbol=symbol,
                    is_active=True
                )
            )
            created_currencies.append(currency)
        logger.info("Created currencies")

        # Create lead stages
        stages = [
            ("New Lead", 1),
            ("Contacted", 2),
            ("Meeting Scheduled", 3),
            ("Proposal Sent", 4),
            ("Negotiation", 5),
            ("Closed Won", 6),
            ("Closed Lost", 7)
        ]
        
        created_stages = []
        for name, order in stages:
            stage = crud.crud_lead_stage.create(
                db,
                obj_in=LeadStageCreate(
                    name=name,
                    order=order
                )
            )
            created_stages.append(stage)
        logger.info("Created lead stages")

        # Create tags
        tags = [
            ("Hot", "#FF4500"),
            ("Cold", "#4682B4"),
            ("VIP", "#FFD700"),
            ("Follow-up", "#32CD32"),
            ("Urgent", "#DC143C")
        ]
        created_tags = []
        for name, color in tags:
            tag = crud.crud_tag.create(
                db,
                obj_in=TagCreate(
                    name=name,
                    color=color
                )
            )
            created_tags.append(tag)
        logger.info("Created tags")

        # Create leads
        leads = [
            (
                "John", "Doe", "john.doe@example.com", "+1234567890",
                "CEO", created_stages[0].id, user1.id
            ),
            (
                "Jane", "Smith", "jane.smith@example.com", "+0987654321",
                "CTO", created_stages[1].id, user1.id
            ),
            (
                "Bob", "Johnson", "bob.johnson@example.com", "+1122334455",
                "CFO", created_stages[2].id, user1.id
            )
        ]

        created_leads = []
        for first_name, last_name, email, phone, title, stage_id, user_id in leads:
            lead = crud.crud_lead.create(
                db,
                obj_in=LeadCreate(
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    phone=phone,
                    title=title,
                    stage_id=stage_id
                ),
                user_id=user_id
            )
            created_leads.append(lead)
        logger.info("Created leads")

        # Create deals
        for i, lead in enumerate(created_leads):
            deal = crud.crud_deal.create(
                db,
                obj_in=DealCreate(
                    title=f"Deal with {lead.first_name} {lead.last_name}",
                    value=float(10000 * (i + 1)),
                    currency="USD",
                    probability=50,
                    expected_close_date=datetime.now() + timedelta(days=30 * (i + 1)),
                    user_id=lead.user_id,
                    lead_id=lead.id
                )
            )
        logger.info("Created deals")

        # Create tasks
        for lead in created_leads:
            task = crud.crud_task.create(
                db,
                obj_in=TaskCreate(
                    user_id=user1.id,
                    lead_id=lead.id,
                    title=f"Follow up with {lead.first_name}",
                    description="Schedule initial meeting",
                    due_date=datetime.now() + timedelta(days=7),
                    priority="HIGH",
                    status="PENDING"
                )
            )
        logger.info("Created tasks")

        # Create activities
        for lead in created_leads:
            activity = crud.crud_activity.create(
                db,
                obj_in=ActivityCreate(
                    type=ActivityType.CALL,
                    description=f"Initial call with {lead.first_name} {lead.last_name}",
                    scheduled_at=datetime.now() + timedelta(days=random.randint(1, 30)),
                    duration=30,  # 30 minutes
                    user_id=lead.user_id,
                    lead_id=lead.id
                )
            )
        logger.info("Created activities")

        # Create notes
        for lead in created_leads:
            note = crud.crud_note.create(
                db,
                obj_in=NoteCreate(
                    content=f"Initial meeting notes for {lead.first_name} {lead.last_name}",
                    user_id=lead.user_id,
                    lead_id=lead.id
                )
            )
        logger.info("Created notes")

        db.commit()
        logger.info("Successfully committed all changes to database")
        
    except Exception as e:
        logger.error(f"Error creating initial data: {e}")
        db.rollback()
        raise

def main() -> None:
    logger.info("Creating initial data")
    db = SessionLocal()
    create_initial_data(db)
    logger.info("Initial data created")

if __name__ == "__main__":
    main()
