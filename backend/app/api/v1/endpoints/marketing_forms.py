"""
Public marketing form submissions (Business Diagnostic, Data Request, Pitch Your Idea).
Persists to DB. Optional email later via settings.
"""
import json
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.core.email import EmailSender
from app.models.marketing_form_submission import MarketingFormSubmission
from app.schemas.marketing_forms import MarketingFormSubmissionCreate

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

    # Notify admin inbox with the full submission payload.
    admin_email = str(body.to_email) if body.to_email else "ali@the-leadlab.com"
    payload_pretty = json.dumps(body.payload or {}, ensure_ascii=False, indent=2, default=str)
    subject = body.subject or f"New {body.form_type.replace('_', ' ')} submission"
    html_content = f"""
    <h2>New marketing form submission</h2>
    <p><strong>Form type:</strong> {body.form_type}</p>
    <p><strong>Name:</strong> {body.full_name}</p>
    <p><strong>Email:</strong> {body.email}</p>
    <p><strong>Company:</strong> {body.company or '-'}</p>
    <p><strong>Phone:</strong> {body.phone or '-'}</p>
    <p><strong>Subject:</strong> {body.subject or '-'}</p>
    <h3>Payload</h3>
    <pre>{payload_pretty}</pre>
    """
    text_content = (
        f"New marketing form submission\n"
        f"Form type: {body.form_type}\n"
        f"Name: {body.full_name}\n"
        f"Email: {body.email}\n"
        f"Company: {body.company or '-'}\n"
        f"Phone: {body.phone or '-'}\n"
        f"Subject: {body.subject or '-'}\n\n"
        f"Payload:\n{payload_pretty}"
    )
    try:
        await EmailSender().send_email(
            to_email=admin_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )
    except Exception:
        # Submission persistence is primary; notification failures must not block users.
        pass

    return {"msg": "Thank you — we received your submission and will be in touch soon.", "id": row.id}
