from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# MySQL bağlantı URL'i
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# MySQL bağlantı ayarları
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=settings.MYSQL_POOL_SIZE,
    max_overflow=settings.MYSQL_MAX_OVERFLOW,
    pool_timeout=settings.MYSQL_POOL_TIMEOUT,
    pool_pre_ping=True,  # Bağlantı kontrolü
    pool_recycle=1800,   # 30 dakikada bir bağlantı yenileme
    echo=settings.DEBUG  # Debug modunda SQL logları
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base model
Base = declarative_base()

# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.token import Token  # noqa
from app.models.transaction import Transaction  # noqa
from app.models.lead import Lead  # noqa
from app.models.organization import Organization  # noqa
from app.models.event import Event  # noqa
from app.models.event_attendee import EventAttendee  # noqa
from app.models.tag import Tag  # noqa
from app.models.task import Task  # noqa
from app.models.deal import Deal  # noqa
from app.models.activity import Activity  # noqa
from app.models.information_request import InformationRequest  # noqa
from app.models.note import Note  # noqa
from app.models.notification import Notification  # noqa
from app.models.file import File  # noqa
from app.models.team_invitation import TeamInvitation  # noqa

# Database bağlantısı için dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
