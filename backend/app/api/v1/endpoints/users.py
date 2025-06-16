from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_user
from app.models.user import User as UserModel
from app.schemas.user import User, UserCreate, UserUpdate, UserInDB, UserList, UserResponse
from app.core.security import get_password_hash
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("", response_model=UserList)
@router.get("/", response_model=UserList)
def get_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    organization_id: Optional[int] = None,
    current_user: UserModel = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve users.
    """
    logger.debug(f"Getting users for user {current_user.id}, skip={skip}, organization_id={organization_id}")
    
    if current_user.is_admin and not organization_id:
        users = crud_user.user.get_multi(db, skip=skip)
    else:
        # Get users from the specified organization or current user's organization
        users = crud_user.user.get_multi(
            db,
            organization_id=organization_id or int(current_user.organization_id),
            is_active=True
        )
    
    total = len(users)
    page = skip // 100 + 1
    has_more = False
    
    # Convert User models to UserResponse
    user_responses = [
        UserResponse(
            id=int(user.id),
            email=str(user.email),
            first_name=str(user.first_name),
            last_name=str(user.last_name),
            is_active=bool(user.is_active),
            is_admin=bool(user.is_admin),
            organization_id=int(user.organization_id)
        ) for user in users
    ]
    
    logger.debug(f"Returning {total} users")
    
    return UserList(
        items=user_responses,
        total=total,
        page=page,
        size=total,
        has_more=has_more
    )

@router.post("/", response_model=UserInDB)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user),
    user_in: UserCreate,
) -> UserInDB:
    """
    Create new user.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to create users"
        )
    
    user = crud_user.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists"
        )
    
    user = crud_user.user.create(db, obj_in=user_in)
    return user

@router.get("/me", response_model=UserInDB)
def get_current_user_info(
    current_user: UserModel = Depends(deps.get_current_user),
) -> UserInDB:
    """
    Get current user info.
    """
    return current_user

@router.put("/me", response_model=UserInDB)
def update_current_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user),
    user_in: UserUpdate,
) -> UserInDB:
    """
    Update current user.
    """
    # Password doğrudan CRUD servisi tarafından hash'lenecek
    # hashed_password atamamıza gerek yok
    
    user = crud_user.user.update(db, db_obj=current_user, obj_in=user_in)
    return user

@router.get("/organization-users", response_model=List[UserResponse])
def get_organization_users(
    current_user: UserModel = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """Get all users from the same organization as the current user"""
    try:
        print(f"DEBUG: Current user: {current_user.email if current_user else 'None'}")
        print(f"DEBUG: Organization ID: {current_user.organization_id if current_user else 'None'}")
        
        if not current_user or not current_user.organization_id:
            raise HTTPException(
                status_code=422,
                detail="Current user or organization ID not found"
            )
            
        users = crud_user.user.get_organization_users(
            db=db,
            organization_id=int(current_user.organization_id)
        )
        
        print(f"DEBUG: Found {len(users) if users else 0} users")
        
        if not users:
            return []
        
        # Convert User models to UserResponse and validate data
        user_responses = []
        for user in users:
            try:
                user_response = UserResponse(
                    id=int(user.id),
                    email=str(user.email),
                    first_name=str(user.first_name),
                    last_name=str(user.last_name),
                    is_active=bool(user.is_active),
                    is_admin=bool(user.is_admin),
                    organization_id=int(user.organization_id),
                    organization_role=str(user.organization_role.value.lower() if hasattr(user.organization_role, 'value') else user.organization_role).lower()
                )
                user_responses.append(user_response)
            except (ValueError, TypeError, AttributeError) as e:
                print(f"Error converting user {user.id}: {str(e)}")
                continue
        
        print(f"DEBUG: Returning {len(user_responses)} user responses")
        return user_responses
        
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid data format: {str(e)}"
        )
    except Exception as e:
        print(f"Error fetching organization users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching organization users: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserInDB)
def get_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user),
    user_id: int,
) -> UserInDB:
    """
    Get user by ID.
    """
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    user = crud_user.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return user

@router.put("/{user_id}", response_model=UserInDB)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user),
    user_id: int,
    user_in: UserUpdate,
) -> UserInDB:
    """
    Update user.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to update users"
        )
    
    user = crud_user.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Password doğrudan CRUD servisi tarafından hash'lenecek
    # hashed_password atamamıza gerek yok
    
    user = crud_user.user.update(db, db_obj=user, obj_in=user_in)
    return user

@router.patch("/{user_id}", response_model=UserInDB)
def patch_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user),
    user_id: int,
    user_in: UserUpdate,
) -> UserInDB:
    """
    Partially update user.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to update users"
        )
    
    user = crud_user.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Doğrudan CRUD servisine password'ü ileteceğiz, 
    # hashed_password ataması yapmıyoruz çünkü model bu alanı desteklemiyor
    # ve CRUD servisi zaten password'ü hash'liyor
    
    # Convert to dict and remove None values for partial update
    update_data = user_in.dict(exclude_unset=True)
    user = crud_user.user.update(db, db_obj=user, obj_in=update_data)
    return user

@router.delete("/{user_id}", response_model=UserInDB)
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user),
    user_id: int,
) -> UserInDB:
    """
    Delete user.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to delete users"
        )
    
    user = crud_user.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    user = crud_user.user.remove(db=db, id=user_id)
    return user
