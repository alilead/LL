from typing import List, Sequence, Tuple
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.currency import Currency
from app.schemas.currency import CurrencyCreate, CurrencyUpdate

# Inserted when DB has no currencies (prod DBs may skip full seed).
DEFAULT_CURRENCY_ROWS: Sequence[Tuple[str, str, str]] = (
    ("USD", "US Dollar", "$"),
    ("EUR", "Euro", "€"),
    ("GBP", "British Pound", "£"),
    ("JPY", "Japanese Yen", "¥"),
    ("CHF", "Swiss Franc", "Fr"),
    ("TRY", "Turkish Lira", "₺"),
)


def ensure_default_currencies(db: Session) -> int:
    """Create missing default currency rows. Returns number of rows inserted."""
    codes = {row[0] for row in db.query(Currency.code).all()}
    n = 0
    for code, name, symbol in DEFAULT_CURRENCY_ROWS:
        if code not in codes:
            db.add(Currency(code=code, name=name, symbol=symbol, is_active=True))
            n += 1
    if n:
        db.commit()
    return n


class CRUDCurrency(CRUDBase[Currency, CurrencyCreate, CurrencyUpdate]):
    def get_by_code(self, db: Session, *, code: str):
        return db.query(Currency).filter(Currency.code == code).first()

    def get_active(self, db: Session) -> List[Currency]:
        return db.query(Currency).filter(Currency.is_active == True).all()

currency = CRUDCurrency(Currency)

__all__ = ["currency"]
