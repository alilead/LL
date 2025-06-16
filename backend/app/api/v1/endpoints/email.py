from typing import Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core.security import check_permission
from app.core.email import send_email
from app.schemas.email import (
    EmailTemplateResponse,
    EmailTemplateListResponse,
    EmailLogResponse,
    EmailLogListResponse,
    SendEmailResponse,
    EmailStatus
)

router = APIRouter()


@router.get("/templates", response_model=EmailTemplateListResponse)
def list_templates(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 10,
    name: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> Any:
    """
    List email templates with filtering and pagination.
    """
    if not check_permission(db, current_user.id, "manage_email_templates"):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to manage email templates"
        )

    filters = {}
    if name:
        filters["name"] = name
    if is_active is not None:
        filters["is_active"] = is_active

    templates = crud.email_template.get_multi(
        db,
        organization_id=current_user.organization_id,
        skip=skip,
        limit=limit,
        filters=filters
    )

    return {
        "success": True,
        "message": "Email templates retrieved successfully",
        "data": templates
    }


@router.post("/templates", response_model=EmailTemplateResponse)
def create_template(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    template_in: schemas.EmailTemplateCreate,
) -> Any:
    """
    Create new email template.
    """
    if not check_permission(db, current_user.id, "manage_email_templates"):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to manage email templates"
        )

    template = crud.email_template.create(db, obj_in=template_in)
    return {
        "success": True,
        "message": "Email template created successfully",
        "data": template
    }


@router.get("/templates/{id}", response_model=EmailTemplateResponse)
def get_template(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get email template by ID.
    """
    if not check_permission(db, current_user.id, "manage_email_templates"):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to manage email templates"
        )

    template = crud.email_template.get(db, id)
    if not template:
        raise HTTPException(
            status_code=404,
            detail="Email template not found"
        )

    if template.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this template"
        )

    return {
        "success": True,
        "message": "Email template retrieved successfully",
        "data": template
    }


@router.put("/templates/{id}", response_model=EmailTemplateResponse)
def update_template(
    id: int,
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    template_in: schemas.EmailTemplateUpdate,
) -> Any:
    """
    Update email template.
    """
    if not check_permission(db, current_user.id, "manage_email_templates"):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to manage email templates"
        )

    template = crud.email_template.get(db, id)
    if not template:
        raise HTTPException(
            status_code=404,
            detail="Email template not found"
        )

    if template.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to modify this template"
        )

    template = crud.email_template.update(
        db, db_obj=template, obj_in=template_in
    )

    return {
        "success": True,
        "message": "Email template updated successfully",
        "data": template
    }


@router.delete("/templates/{id}", response_model=EmailTemplateResponse)
def delete_template(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete email template.
    """
    if not check_permission(db, current_user.id, "manage_email_templates"):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to manage email templates"
        )

    template = crud.email_template.get(db, id)
    if not template:
        raise HTTPException(
            status_code=404,
            detail="Email template not found"
        )

    if template.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to delete this template"
        )

    template = crud.email_template.remove(db, id=id)
    return {
        "success": True,
        "message": "Email template deleted successfully",
        "data": template
    }


@router.post("/send", response_model=SendEmailResponse)
async def send_email_endpoint(
    background_tasks: BackgroundTasks,
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    email_in: schemas.SendEmailRequest,
) -> Any:
    """
    Send email using template.
    """
    if not check_permission(db, current_user.id, "send_email"):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to send emails"
        )

    template = crud.email_template.get(db, email_in.template_id)
    if not template:
        raise HTTPException(
            status_code=404,
            detail="Email template not found"
        )

    if template.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to use this template"
        )

    if not template.is_active:
        raise HTTPException(
            status_code=400,
            detail="Email template is not active"
        )

    try:
        # Render email content
        content = template.render(email_in.context)

        # Create email log
        log_in = schemas.EmailLogCreate(
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            template_id=template.id,
            to_email=email_in.to_email,
            subject=template.subject,
            content=content
        )
        log = crud.email_log.create(db, obj_in=log_in)

        # Send email in background
        background_tasks.add_task(
            send_email,
            db,
            log.id,
            email_in.to_email,
            template.subject,
            content
        )

        return {
            "success": True,
            "message": "Email queued for sending",
            "data": log
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error sending email: {str(e)}"
        )


@router.get("/logs", response_model=EmailLogListResponse)
def list_logs(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 10,
    status: Optional[EmailStatus] = None,
    to_email: Optional[str] = None,
    template_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Any:
    """
    List email logs with filtering and pagination.
    """
    if not check_permission(db, current_user.id, "view_email_logs"):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to view email logs"
        )

    filters = {}
    if status:
        filters["status"] = status
    if to_email:
        filters["to_email"] = to_email
    if template_id:
        filters["template_id"] = template_id
    if start_date:
        filters["start_date"] = start_date
    if end_date:
        filters["end_date"] = end_date

    logs = crud.email_log.get_multi(
        db,
        organization_id=current_user.organization_id,
        skip=skip,
        limit=limit,
        filters=filters
    )

    return {
        "success": True,
        "message": "Email logs retrieved successfully",
        "data": logs
    }
