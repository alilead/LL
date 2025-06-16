from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.currency import Currency
from app.schemas.currency import CurrencyCreate, CurrencyUpdate

class CRUDCurrency(CRUDBase[Currency, CurrencyCreate, CurrencyUpdate]):
    def get_by_code(self, db: Session, *, code: str):
        return db.query(Currency).filter(Currency.code == code).first()

    def get_active(self, db: Session) -> List[Currency]:
        return db.query(Currency).filter(Currency.is_active == True).all()

currency = CRUDCurrency(Currency)

__all__ = ["currency"]
