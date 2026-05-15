"""
Public marketing form submissions (Business Diagnostic, Data Request, Pitch Your Idea).
Persists to DB. Optional email later via settings.
"""
import json
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.api import deps
from app.core.email import EmailSender
from app.models.marketing_form_submission import MarketingFormSubmission
from app.models.user import User
from app.schemas.marketing_forms import MarketingFormSubmissionCreate
from app.services.marketing_form_email import build_data_request_email, build_generic_email

router = APIRouter()


@router.post("/submit", response_model=dict)
async def submit_marketing_form(
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

    # Primary admin inbox + any active platform admins (super prompt: ali + admins).
    primary_admin = "ali@the-leadlab.com"
    recipient_set = {primary_admin}
    if body.to_email:
        recipient_set.add(str(body.to_email).strip().lower())
    admin_rows = (
        db.query(User)
        .filter(
            User.is_active == True,
            or_(User.is_superuser == True, func.lower(User.role) == "admin"),
        )
        .all()
    )
    for u in admin_rows:
        if getattr(u, "email", None):
            recipient_set.add(str(u.email).strip().lower())

    subject = body.subject or f"New {body.form_type.replace('_', ' ')} submission"
    payload = body.payload or {}
    if body.form_type == "data_request":
        html_content, text_content = build_data_request_email(body, payload)
    else:
        html_content, text_content = build_generic_email(body, payload)
    try:
        sender = EmailSender()
        for recipient in sorted(recipient_set):
            await sender.send_email(
                to_email=recipient,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
            )
    except Exception:
        # Submission persistence is primary; notification failures must not block users.
        pass

    return {"msg": "Thank you — we received your submission and will be in touch soon.", "id": row.id}
