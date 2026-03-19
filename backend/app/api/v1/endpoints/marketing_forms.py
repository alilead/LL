"""
Public marketing form submissions (Business Diagnostic, Data Request, Pitch Your Idea).
Persists to DB. Optional email later via settings.
"""
import json
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models.marketing_form_submission import MarketingFormSubmission
from app.schemas.marketing_forms import MarketingFormSubmissionCreate

router = APIRouter()


@router.post("/submit", response_model=dict)
def submit_marketing_form(
    body: MarketingFormSubmissionCreate,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Save submission to database. Email notifications can be enabled later (see settings).
    """
    row = MarketingFormSubmission(
        form_type=body.form_type,
        full_name=body.full_name,
        email=str(body.email),
        company=body.company,
        phone=body.phone,
        subject=body.subject,
        payload_json=json.dumps(body.payload, ensure_ascii=False, default=str) if body.payload else None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {"msg": "Thank you — we received your submission and will be in touch soon.", "id": row.id}
