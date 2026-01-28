import logging
from typing import Any, Optional, List, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core.security import check_permission
from app.core.email import EmailSender
from app.models.email_account import EmailAccount, EmailProviderType, EmailSyncStatus
from app.models.email_message import Email, EmailDirection, EmailStatus
from app.models.user import User
from app.models.organization import Organization
from app.services.email_service import EmailService
from app.schemas.email import (
    EmailTemplateResponse,
    EmailTemplateListResponse,
    EmailLogResponse,
    EmailLogListResponse,
    SendEmailResponse,
    EmailStatus as EmailStatusSchema
)
from app.schemas.email_integration import (
    EmailAccountCreate, EmailAccountUpdate, EmailAccountOut,
    EmailOut, EmailSend, EmailSuggestion
)
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

async def send_email_background(
    db: Session,
    log_id: int,
    to_email: str,
    subject: str,
    body: str
) -> None:
    """Background task for sending emails"""
    try:
        # Get email log
        log = crud.email_log.get(db, log_id)
        if not log:
            return

        # Send email
        email_sender = EmailSender()
        await email_sender.send_email(
            to_email=to_email,
            subject=subject,
            html_content=body
        )

        # Update log status
        crud.email_log.update(
            db,
            db_obj=log,
            obj_in={"status": schemas.email.EmailStatus.SENT}
        )

    except Exception as e:
        # Update log with error status
        if log:
            crud.email_log.update(
                db,
                db_obj=log,
                obj_in={
                    "status": schemas.email.EmailStatus.FAILED,
                    "error_message": str(e)
                }
            )


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


@router.post("/send", response_model=Dict[str, str])
async def send_email(
    email_data: schemas.email_integration.EmailSend,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Send an email"""
    email_service = EmailService(db)
    
    # Get account
    account = db.query(EmailAccount).filter(
        EmailAccount.id == email_data.account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.organization_id == current_user.organization_id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    success = email_service.send_email(
        account_id=email_data.account_id,
        to_emails=email_data.to_emails,
        subject=email_data.subject,
        body_text=email_data.body_text,
        body_html=email_data.body_html,
        cc_emails=email_data.cc_emails,
        bcc_emails=email_data.bcc_emails,
        reply_to=email_data.reply_to
    )
    
    if success:
        return {"message": "Email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")


@router.post("/send-template", response_model=schemas.email.SendEmailResponse)
async def send_email_template(
    background_tasks: BackgroundTasks,
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    email_in: schemas.email.SendEmailRequest,
) -> Any:
    """Send email using template"""
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

    # Replace variables in template
    body = template.body
    if email_in.variables:
        for key, value in email_in.variables.items():
            body = body.replace(f"{{{key}}}", str(value))

    # Create email log
    log = crud.email_log.create(
        db,
        obj_in=schemas.email.EmailLogCreate(
            template_id=template.id,
            to_email=email_in.to_email,
            subject=template.subject,
            body=body,
            status=schemas.email.EmailStatus.PENDING,
            organization_id=current_user.organization_id
        )
    )

    # Send email in background
    background_tasks.add_task(
        send_email_background,
        db=db,
        log_id=log.id,
        to_email=email_in.to_email,
        subject=template.subject,
        body=body
    )

    return {
        "success": True,
        "message": "Email scheduled for sending",
        "log_id": log.id
    }


@router.get("/logs", response_model=EmailLogListResponse)
def list_logs(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 10,
    status: Optional[EmailStatusSchema] = None,
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


@router.get("/accounts", response_model=List[EmailAccountOut])
def get_email_accounts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get all email accounts for the current user"""
    accounts = db.query(EmailAccount).filter(
        EmailAccount.user_id == current_user.id,
        EmailAccount.organization_id == current_user.organization_id
    ).all()
    return accounts


@router.post("/accounts", response_model=EmailAccountOut)
def create_email_account(
    account_in: EmailAccountCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Connect a new email account"""
    email_service = EmailService(db)
    
    try:
        # Convert string provider_type to enum - handle case insensitive
        provider_type_str = account_in.provider_type.lower()
        
        # Map the provider type correctly
        provider_mapping = {
            'gmail': EmailProviderType.GMAIL,
            'outlook': EmailProviderType.OUTLOOK,
            'yahoo': EmailProviderType.YAHOO,
            'custom': EmailProviderType.CUSTOM
        }
        
        if provider_type_str not in provider_mapping:
            raise ValueError(f"Invalid provider type: {account_in.provider_type}. Valid options are: gmail, outlook, yahoo, custom")
            
        provider_type = provider_mapping[provider_type_str]
        
        # Check if account already exists
        existing_account = db.query(EmailAccount).filter(
            EmailAccount.email == account_in.email,
            EmailAccount.organization_id == current_user.organization_id
        ).first()
        
        if existing_account:
            raise HTTPException(
                status_code=409,  # Conflict
                detail={
                    "error": "Email account already exists",
                    "account_id": existing_account.id,
                    "message": "An email account with this address already exists for your organization. Use the update endpoint to modify the existing account.",
                    "existing_account": {
                        "id": existing_account.id,
                        "email": existing_account.email,
                        "provider": existing_account.provider_type,
                        "display_name": existing_account.display_name,
                        "created_at": existing_account.created_at.isoformat() if existing_account.created_at else None
                    }
                }
            )
            
        account = email_service.add_email_account(
            email=account_in.email,
            password=account_in.password,
            display_name=account_in.display_name,
            provider_type=provider_type,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            custom_settings=account_in.custom_settings
        )
        
        # Start background sync
        background_tasks.add_task(
            email_service.sync_account_emails,
            account.id
        )
        
        return account
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating email account: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create email account")


@router.put("/accounts/{account_id}", response_model=EmailAccountOut)
def update_email_account(
    account_id: int,
    account_in: EmailAccountUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Update an existing email account"""
    
    try:
        # Get existing account
        existing_account = db.query(EmailAccount).filter(
            EmailAccount.id == account_id,
            EmailAccount.organization_id == current_user.organization_id
        ).first()
        
        if not existing_account:
            raise HTTPException(status_code=404, detail="Email account not found")
        
        # Create update data
        update_data = {}
        
        # Update basic fields if provided
        if account_in.display_name is not None:
            update_data['display_name'] = account_in.display_name
            
        if account_in.password is not None:
            from app.core.security import encrypt_password
            update_data['password_encrypted'] = encrypt_password(account_in.password)
            
        if account_in.provider_type is not None:
            provider_type_str = account_in.provider_type.lower()
            provider_mapping = {
                'gmail': EmailProviderType.GMAIL.value,
                'outlook': EmailProviderType.OUTLOOK.value,
                'yahoo': EmailProviderType.YAHOO.value,
                'custom': EmailProviderType.CUSTOM.value
            }
            
            if provider_type_str not in provider_mapping:
                raise ValueError(f"Invalid provider type: {account_in.provider_type}")
                
            update_data['provider_type'] = provider_mapping[provider_type_str]
        
        # Update custom settings if provided
        if account_in.custom_settings:
            email_service = EmailService(db)
            current_email = existing_account.email
            current_provider = account_in.provider_type or existing_account.provider_type
            
            imap_settings, smtp_settings = email_service._get_provider_settings(
                email=current_email,
                provider_type=current_provider,
                custom_settings=account_in.custom_settings
            )
            
            update_data.update(imap_settings)
            update_data.update(smtp_settings)
        
        # Update sync settings if provided  
        sync_fields = [
            'sync_enabled', 'sync_frequency_minutes', 'sync_sent_items', 
            'sync_inbox', 'days_to_sync', 'auto_create_contacts', 
            'auto_create_tasks', 'calendar_sync_enabled'
        ]
        
        for field in sync_fields:
            value = getattr(account_in, field, None)
            if value is not None:
                update_data[field] = value
        
        # Apply updates
        for key, value in update_data.items():
            setattr(existing_account, key, value)
        
        # Update timestamp
        existing_account.updated_at = datetime.utcnow()
        
        # Save changes
        db.commit()
        db.refresh(existing_account)
        
        # Start background sync if connection settings changed
        if any(key in update_data for key in ['password_encrypted', 'imap_host', 'smtp_host']):
            background_tasks.add_task(
                EmailService(db).sync_account_emails,
                existing_account.id
            )
        
        return existing_account
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating email account: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update email account")


@router.delete("/accounts/{account_id}")
def delete_email_account(
    account_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Remove an email account"""
    account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.organization_id == current_user.organization_id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    db.delete(account)
    db.commit()
    
    return {"message": "Email account deleted successfully"}


@router.post("/accounts/{account_id}/sync")
def sync_email_account(
    account_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Start email sync for an account"""
    account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.organization_id == current_user.organization_id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    email_service = EmailService(db)
    
    # Start background sync
    background_tasks.add_task(
        email_service.sync_account_emails,
        account_id
    )
    
    return {
        "message": f"Email sync initiated for account {account.email}",
        "status": "started"
    }


@router.post("/accounts/{account_id}/sync-calendar")
async def sync_calendar(
    account_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Sync calendar events from email provider"""
    try:
        # Get email account
        email_account = db.query(EmailAccount).filter(
            EmailAccount.id == account_id,
            EmailAccount.user_id == current_user.id,
            EmailAccount.organization_id == current_user.organization_id
        ).first()
        
        if not email_account:
            raise HTTPException(status_code=404, detail="Email account not found")
        
        if not email_account.calendar_sync_enabled:
            raise HTTPException(status_code=400, detail="Calendar sync is disabled for this account")
        
        # Import here to avoid circular imports
        from app.services.calendar_sync_service import CalendarSyncService
        
        calendar_service = CalendarSyncService(db)
        result = await calendar_service.sync_account_calendar(email_account)
        
        return {
            "message": f"Calendar sync completed for {email_account.email}",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Calendar sync failed for account {account_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Calendar sync failed: {str(e)}")


@router.post("/accounts/{account_id}/calendar-settings")
async def update_calendar_settings(
    account_id: int,
    settings: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Update calendar sync settings for an email account"""
    # Get email account
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    # Update calendar settings
    if "calendar_sync_enabled" in settings:
        email_account.calendar_sync_enabled = settings["calendar_sync_enabled"]
    
    if "auto_sync_calendar_events" in settings:
        email_account.auto_sync_calendar_events = settings["auto_sync_calendar_events"]
    
    if "calendar_url" in settings:
        email_account.calendar_url = settings["calendar_url"]
    
    db.commit()
    
    return {
        "message": "Calendar settings updated successfully",
        "settings": {
            "calendar_sync_enabled": email_account.calendar_sync_enabled,
            "auto_sync_calendar_events": email_account.auto_sync_calendar_events,
            "calendar_url": email_account.calendar_url
        }
    }


@router.get("/emails", response_model=List[EmailOut])
def get_emails(
    skip: int = 0,
    limit: int = 100,
    account_id: Optional[int] = None,
    unread_only: bool = False,
    direction: Optional[str] = None,  # "incoming", "outgoing", or None for all
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get emails for the current user"""
    query = db.query(Email).filter(
        Email.organization_id == current_user.organization_id
    )
    
    if account_id:
        query = query.filter(Email.email_account_id == account_id)
    
    # For sent emails (outgoing), we don't filter by unread status
    # since sent emails are not typically marked as unread
    if direction:
        if direction.lower() == "incoming":
            query = query.filter(Email.direction == EmailDirection.incoming)
            if unread_only:
                query = query.filter(Email.status == EmailStatus.unread)
        elif direction.lower() == "outgoing":
            query = query.filter(Email.direction == EmailDirection.outgoing)
            # Don't apply unread filter for outgoing emails
        else:
            # Invalid direction parameter
            raise HTTPException(status_code=400, detail="Invalid direction. Use 'incoming' or 'outgoing'")
    else:
        # No direction specified, apply unread filter if requested
        if unread_only:
            query = query.filter(Email.status == EmailStatus.unread)
    
    emails = query.order_by(Email.sent_date.desc()).offset(skip).limit(limit).all()
    return emails


@router.get("/emails/{email_id}", response_model=EmailOut)
def get_email(
    email_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get a specific email"""
    email = db.query(Email).filter(
        Email.id == email_id,
        Email.organization_id == current_user.organization_id
    ).first()
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    return email


@router.post("/emails/{email_id}/mark-read")
def mark_email_read(
    email_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Mark an email as read"""
    email = db.query(Email).filter(
        Email.id == email_id,
        Email.organization_id == current_user.organization_id
    ).first()
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    email.status = EmailStatus.read
    db.commit()
    
    return {"message": "Email marked as read"}


@router.get("/emails/{email_id}/suggestions", response_model=List[EmailSuggestion])
def get_email_suggestions(
    email_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get AI suggestions for calendar events and tasks from email"""
    email = db.query(Email).filter(
        Email.id == email_id,
        Email.organization_id == current_user.organization_id
    ).first()
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    parser = EmailParser(db)
    suggestions = []
    
    # Get event suggestions
    event_suggestions = parser.parse_email_for_events(email_id)
    for event in event_suggestions:
        suggestions.append(EmailSuggestion(
            type="event",
            title=event['title'],
            description=event['description'],
            confidence_score=event['confidence_score'],
            data=event
        ))
    
    # Get task suggestions
    task_suggestions = parser.parse_email_for_tasks(email_id)
    for task in task_suggestions:
        suggestions.append(EmailSuggestion(
            type="task",
            title=task['title'],
            description=task['description'],
            confidence_score=task['confidence_score'],
            data=task
        ))
    
    return suggestions


@router.post("/emails/{email_id}/create-event")
def create_event_from_email(
    email_id: int,
    event_data: Dict[str, Any],
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Create a calendar event from email suggestion"""
    email = db.query(Email).filter(
        Email.id == email_id,
        Email.organization_id == current_user.organization_id
    ).first()
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    parser = EmailParser(db)
    event = parser.create_calendar_event_from_email(email_id, event_data)
    
    if event:
        return {"message": "Calendar event created successfully", "event_id": event.id}
    else:
        raise HTTPException(status_code=500, detail="Failed to create calendar event")


@router.post("/emails/{email_id}/create-task")
def create_task_from_email(
    email_id: int,
    task_data: Dict[str, Any],
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Create a task from email suggestion"""
    email = db.query(Email).filter(
        Email.id == email_id,
        Email.organization_id == current_user.organization_id
    ).first()
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    parser = EmailParser(db)
    task = parser.create_task_from_email(email_id, task_data)
    
    if task:
        return {"message": "Task created successfully", "task_id": task.id}
    else:
        raise HTTPException(status_code=500, detail="Failed to create task")
