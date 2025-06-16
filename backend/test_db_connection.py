#!/usr/bin/env python3
"""
Test database connection
"""
from app.db.base import get_db
from app.models.user import User
from sqlalchemy.orm import Session

try:
    db = next(get_db())
    user = db.query(User).first()
    print(f'✅ Database connection OK, found user: {user.email if user else "No users"}')
    db.close()
except Exception as e:
    print(f'❌ Database error: {e}')
    import traceback
    traceback.print_exc() 