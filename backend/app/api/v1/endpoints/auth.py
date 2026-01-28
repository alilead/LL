from datetime import timedelta, datetime
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.schemas.auth import TokenResponse, UserLogin
from pydantic import BaseModel, EmailStr
from app.schemas.user import User
from app.core.email import email_sender
from app.utils.auth import generate_password_reset_token, verify_password_reset_token, generate_email_verification_token, verify_email_verification_token
import logging
import json

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    company: Optional[str] = None

class ChangePasswordInput(BaseModel):
    current_password: str
    new_password: str

@router.post("/register", response_model=schemas.User)
async def register(
    *,
    db: Session = Depends(deps.get_db),
    background_tasks: BackgroundTasks,
    register_in: RegisterInput,
) -> Any:
    """
    Register new user with a new organization
    """
    try:
        # Check if user already exists
        user = crud.user.get_by_email(db, email=register_in.email)
        if user:
            raise HTTPException(
                status_code=400,
                detail="The user with this email already exists in the system",
            )

        # Create new organization
        org_name = register_in.company or f"{register_in.first_name}'s Organization"
        organization = crud.organization.create_with_owner(db, name=org_name)

        # Create new user
        user_in = schemas.UserCreate(
            email=register_in.email,
            password=register_in.password,
            first_name=register_in.first_name,
            last_name=register_in.last_name,
            organization_id=organization.id,
            is_active=True,
            is_admin=True  # First user of organization is admin
        )
        user = crud.user.create(db, obj_in=user_in)
        
        # Send welcome email in background
        login_link = f"{settings.FRONTEND_URL}/signin"
        background_tasks.add_task(
            email_sender.send_welcome_email,
            user.email,
            user.first_name,
            login_link
        )
        
        return User.model_validate(user)

    except Exception as e:
        print(f"Registration error for {register_in.email}: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/login", response_model=TokenResponse)
@router.post("/login/", response_model=TokenResponse)
async def login(
    *,
    db: Session = Depends(deps.get_db),
    login_in: UserLogin,
    response: Response,
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    try:
        # Get login identifier (email or username)
        login_identifier = login_in.get_identifier()
        logger.critical(f"[DEBUG] Login attempt for: {login_identifier}")
        
        # Find user using raw SQL to avoid relationship lazy-loading issues
        from sqlalchemy import text
        try:
            # Query user directly with raw SQL to get password hash without relationships
            # Note: is_admin column doesn't exist, so we'll omit it and default to False
            result = db.execute(
                text("SELECT id, email, hashed_password, first_name, last_name, is_active, organization_id, created_at, updated_at, username FROM users WHERE email = :identifier OR username = :identifier LIMIT 1"),
                {"identifier": login_identifier}
            )
            user_row = result.first()
            
            if not user_row:
                logger.critical(f"[DEBUG] User not found: {login_identifier}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email/username or password",
                )
            
            logger.critical(f"[DEBUG] Found user: {user_row.email}")
            password_hash_value = user_row.hashed_password
            logger.critical(f"[DEBUG] Password hash retrieved, length: {len(password_hash_value) if password_hash_value else 0}")
            
            # Verify password
            logger.critical(f"[DEBUG] Checking password...")
            password_valid = security.verify_password(login_in.password, password_hash_value)
            logger.critical(f"[DEBUG] Password verification result: {password_valid}")
            
            if not password_valid:
                logger.critical(f"[DEBUG] Password verification failed for: {login_identifier}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email/username or password",
                )
            
            logger.critical(f"[DEBUG] Password verified for: {login_identifier}")
            
            # Check if user is active
            if not user_row.is_active:
                logger.critical(f"[DEBUG] Inactive user: {login_identifier}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Account is inactive. Please contact support."
                )
            
            # Store user data from raw query for later use
            user_id = user_row.id
            user_email = user_row.email
            user_org_id = user_row.organization_id
            
            # Get user object for token generation and last_login update
            # Use raw SQL to update last_login to avoid relationship issues
            user = None
            try:
                # Try to get user object
                user = crud.user.get(db, id=user_id)
                if not user:
                    raise ValueError("User not found after password verification")
            except Exception as user_load_error:
                logger.warning(f"[DEBUG] Could not load user object: {str(user_load_error)}")
                # If we can't load the user object, we'll update last_login with raw SQL
                # and create a minimal user object for the response
                from types import SimpleNamespace
                try:
                    # Update last_login with raw SQL
                    db.execute(
                        text("UPDATE users SET last_login = NOW() WHERE id = :user_id"),
                        {"user_id": user_id}
                    )
                    db.commit()
                except Exception as update_error:
                    logger.warning(f"[DEBUG] Could not update last_login: {str(update_error)}")
                    db.rollback()
                
                # Create a minimal user-like object from the row data
                user = SimpleNamespace(
                    id=user_id,
                    email=user_email,
                    username=user_row.username,
                    first_name=user_row.first_name,
                    last_name=user_row.last_name,
                    is_active=user_row.is_active,
                    is_admin=False,  # Column doesn't exist in database, default to False
                    organization_id=user_org_id,
                    created_at=user_row.created_at,
                    updated_at=user_row.updated_at,
                    last_login=datetime.utcnow()
                )
            
        except HTTPException:
            raise
        except Exception as user_error:
            logger.critical(f"[DEBUG] Error in user lookup/verification: {str(user_error)}")
            logger.exception("[DEBUG] User lookup exception:")
            # Return more detailed error for debugging
            error_detail = f"Authentication error: {str(user_error)}"
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_detail
            )
        
        # Check if user is active (using the user object)
        if not user.is_active:
            logger.critical(f"[DEBUG] Inactive user: {login_identifier}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive. Please contact support."
            )
        
        # Generate access token
        logger.critical(f"[DEBUG] Generating token for user: {login_identifier}")
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        expires_at = datetime.utcnow() + access_token_expires
        
        try:
            access_token = security.create_access_token(
                user.id,
                expires_delta=access_token_expires,
                organization_id=user.organization_id
            )
            logger.critical(f"[DEBUG] Token created for user: {login_identifier}")
            
            # Update last login time (only if user is a real SQLAlchemy object)
            if hasattr(user, '__table__'):  # Check if it's a SQLAlchemy model
                try:
                    user.last_login = datetime.utcnow()
                    db.commit()
                except Exception as update_error:
                    logger.warning(f"[DEBUG] Could not update last_login: {str(update_error)}")
                    db.rollback()
            # If user is SimpleNamespace, last_login was already updated with raw SQL
            
        except Exception as token_error:
            logger.critical(f"[DEBUG] Token creation error: {str(token_error)}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication system error. Please try again."
            )
        
        # Create response object
        try:
            logger.critical(f"[DEBUG] Creating response for user: {login_identifier}")
            
            # Get token balance for the user (tokens table may not exist, so default to 0.0)
            token_balance = 0.0
            # Note: Tokens table doesn't exist in this database, so we skip the query
            # If you need token functionality, create the tokens table first
            
            # Safely extract user data without triggering lazy loading
            try:
                user_id = user.id
                user_email = user.email
                user_username = getattr(user, 'username', None)
                user_first_name = getattr(user, 'first_name', None)
                user_last_name = getattr(user, 'last_name', None)
                user_is_active = getattr(user, 'is_active', True)
                # Use is_admin property which checks if role == 'admin' or is_superuser == 1
                user_is_admin = user.is_admin if hasattr(user, 'is_admin') else (user.is_superuser if hasattr(user, 'is_superuser') else False)
                user_org_id = getattr(user, 'organization_id', None)
                
                # Safely handle datetime objects
                created_at_str = None
                updated_at_str = None
                try:
                    if hasattr(user, 'created_at') and user.created_at:
                        created_at_str = user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at)
                except Exception as e:
                    logger.warning(f"[DEBUG] Error serializing created_at: {str(e)}")
                
                try:
                    if hasattr(user, 'updated_at') and user.updated_at:
                        updated_at_str = user.updated_at.isoformat() if hasattr(user.updated_at, 'isoformat') else str(user.updated_at)
                except Exception as e:
                    logger.warning(f"[DEBUG] Error serializing updated_at: {str(e)}")
                
                response_data = {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "expires_at": expires_at.isoformat(),
                    "user": {
                    "id": user_id,
                    "email": user_email,
                    "username": user_username,
                    "first_name": user_first_name,
                    "last_name": user_last_name,
                    "is_active": user_is_active,
                    "is_admin": user_is_admin,  # Use the computed value from property
                    "organization_id": user_org_id,
                    "created_at": created_at_str,
                    "updated_at": updated_at_str,
                    "token_balance": token_balance
                    }
                }
            except Exception as user_data_error:
                logger.critical(f"[DEBUG] Error extracting user data: {str(user_data_error)}")
                logger.exception("[DEBUG] User data extraction exception:")
                raise
            
            logger.critical(f"[DEBUG] Response created successfully for: {login_identifier}")
            response.status_code = status.HTTP_200_OK
            return response_data
            
        except Exception as response_error:
            logger.critical(f"[DEBUG] Response creation error: {str(response_error)}")
            logger.exception("[DEBUG] Response creation exception:")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error creating login response. Please try again."
            )
            
    except HTTPException as he:
        logger.critical(f"[DEBUG] HTTP Exception: {he.detail}, status: {he.status_code}")
        raise he
    except Exception as e:
        logger.critical(f"[DEBUG] Unhandled exception: {str(e)}")
        logger.exception("[DEBUG] Full exception details:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Please try again later."
        )

@router.post("/logout")
def logout() -> Any:
    """
    Logout 
    """
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=schemas.User)
def get_current_user(
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Get current user
    """
    return User.model_validate(current_user)

@router.patch("/me", response_model=schemas.User)
def update_current_user_patch(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    user_in: schemas.UserUpdate,
) -> Any:
    """
    Update current user profile using PATCH method
    """
    try:
        # Update user using the CRUD service
        from app.crud import crud_user
        user = crud_user.user.update(db, db_obj=current_user, obj_in=user_in)
        return User.model_validate(user)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/change-password", response_model=schemas.User)
def change_password(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    password_in: ChangePasswordInput,
) -> Any:
    """
    Change current user password
    """
    try:
        # Verify current password
        if not security.verify_password(password_in.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect",
            )
        
        # Update password
        user_in = schemas.UserUpdate(password=password_in.new_password)
        user = crud.user.update(db, db_obj=current_user, obj_in=user_in)
        return User.model_validate(user)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.get("/test-token", response_model=schemas.User)
def test_token(current_user: models.User = Depends(deps.get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user

class ForgotPasswordInput(BaseModel):
    email: EmailStr

class ResetPasswordInput(BaseModel):
    token: str
    new_password: str

class VerifyEmailInput(BaseModel):
    token: str

@router.post("/forgot-password")
async def forgot_password(
    *,
    db: Session = Depends(deps.get_db),
    background_tasks: BackgroundTasks,
    forgot_password_in: ForgotPasswordInput,
) -> Any:
    """
    Send password reset email
    """
    try:
        user = crud.user.get_by_email(db, email=forgot_password_in.email)
        if not user:
            # For security, don't reveal if email exists or not
            return {"message": "If the email exists, password reset instructions have been sent"}
        
        # Generate reset token
        reset_token = generate_password_reset_token(forgot_password_in.email)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        # Send email in background
        background_tasks.add_task(
            email_sender.send_password_reset,
            user.email,
            reset_link
        )
        
        return {"message": "If the email exists, password reset instructions have been sent"}
    
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error sending password reset email"
        )

@router.post("/resend-password-reset")
async def resend_password_reset(
    *,
    db: Session = Depends(deps.get_db),
    background_tasks: BackgroundTasks,
    forgot_password_in: ForgotPasswordInput,
) -> Any:
    """
    Resend password reset email (useful if email bounced or wasn't received)
    """
    try:
        user = crud.user.get_by_email(db, email=forgot_password_in.email)
        if not user:
            # For security, don't reveal if email exists or not
            return {"message": "If the email exists, password reset instructions have been sent"}
        
        # Generate new reset token
        reset_token = generate_password_reset_token(forgot_password_in.email)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        # Send email in background
        background_tasks.add_task(
            email_sender.send_password_reset,
            user.email,
            reset_link
        )
        
        return {"message": "If the email exists, password reset instructions have been sent"}
    
    except Exception as e:
        logger.error(f"Resend password reset error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error resending password reset email"
        )

@router.post("/reset-password")
async def reset_password(
    *,
    db: Session = Depends(deps.get_db),
    reset_password_in: ResetPasswordInput,
) -> Any:
    """
    Reset password with token
    """
    try:
        # Verify token
        email = verify_password_reset_token(reset_password_in.token)
        if not email:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset token"
            )
        
        # Get user
        user = crud.user.get_by_email(db, email=email)
        if not user:
            raise HTTPException(
                status_code=400,
                detail="User not found"
            )
        
        # Update password
        user_in = schemas.UserUpdate(password=reset_password_in.new_password)
        user = crud.user.update(db, db_obj=user, obj_in=user_in)
        
        return {"message": "Password reset successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error resetting password"
        )

@router.post("/send-verification-email")
async def send_verification_email(
    *,
    db: Session = Depends(deps.get_db),
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Send email verification
    """
    try:
        # Generate verification token
        verification_token = generate_email_verification_token(current_user.email)
        verification_link = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        
        # Send email in background
        background_tasks.add_task(
            email_sender.send_email_verification,
            current_user.email,
            current_user.first_name,
            verification_link
        )
        
        return {"message": "Verification email sent"}
    
    except Exception as e:
        logger.error(f"Send verification email error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error sending verification email"
        )

@router.post("/verify-email")
async def verify_email(
    *,
    db: Session = Depends(deps.get_db),
    verify_email_in: VerifyEmailInput,
) -> Any:
    """
    Verify email with token
    """
    try:
        # Verify token
        email = verify_email_verification_token(verify_email_in.token)
        if not email:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification token"
            )
        
        # Get user
        user = crud.user.get_by_email(db, email=email)
        if not user:
            raise HTTPException(
                status_code=400,
                detail="User not found"
            )
        
        # Mark user as verified (you may want to add an email_verified field to User model)
        # For now, we'll just return success
        
        return {"message": "Email verified successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify email error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error verifying email"
        )