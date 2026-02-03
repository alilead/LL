from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.api import deps
from app.crud import crud_task
from app.models.user import User
from app.models.task import TaskStatus, TaskPriority
from app.schemas.task import Task, TaskCreate, TaskUpdate, TaskList
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("", response_model=TaskList)
@router.get("/", response_model=TaskList)
def get_tasks(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100
) -> TaskList:
    """
    Retrieve tasks for current user's organization.
    """
    logger.info(f"User {current_user.id} requesting tasks for org {current_user.organization_id}")
    tasks = crud_task.task.get_multi(
        db,
        skip=skip,
        limit=limit,
        organization_id=current_user.organization_id
    )
    total = len(tasks)
    return TaskList(items=tasks, total=total)

@router.post("", response_model=Task)
@router.post("/", response_model=Task)
def create_task(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    task_in: TaskCreate,
) -> Any:
    """
    Create a new task.
    """
    # If user is not admin, ensure organization_id is set to current user's org
    if not current_user.is_admin:
        task_in.organization_id = current_user.organization_id
    
    # Create the task
    task = crud_task.task.create(db, obj_in=task_in)
    
    # Log activity for task creation (non-blocking; fix sequence if UniqueViolation)
    try:
        from app.models.activity import Activity, ActivityType

        lead_id = getattr(task_in, "lead_id", None)
        deal_id = getattr(task_in, "deal_id", None)

        activity = Activity(
            type=ActivityType.TASK_CREATED,
            description=f"Task created: {task.title}",
            user_id=current_user.id,
            organization_id=task.organization_id,
            lead_id=lead_id,
            deal_id=deal_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
    except IntegrityError as e:
        db.rollback()
        if "activities_pkey" in str(e) or "UniqueViolation" in str(e):
            try:
                db.execute(text(
                    "SELECT setval(pg_get_serial_sequence('activities', 'id'), COALESCE((SELECT MAX(id) FROM activities), 1))"
                ))
                db.commit()
            except Exception as seq_e:
                logger.warning("Could not reset activities sequence: %s", seq_e)
        logger.warning("Activity creation failed for task (task still created): %s", e)
    except Exception as e:
        db.rollback()
        logger.warning("Error creating activity for task creation: %s", e)

    return task

@router.get("/{task_id}", response_model=Task)
def get_task(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    task_id: int,
) -> Task:
    """
    Get task by ID.
    """
    logger.info(f"User {current_user.id} requesting task {task_id}")
    task = crud_task.task.get(db, task_id)
    if not task:
        logger.warning(f"Task {task_id} not found")
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Debug log to see what's happening
    logger.info(f"Task org_id: {task.organization_id}, User org_id: {current_user.organization_id}")
    
    # Check if task belongs to user's organization
    if task.organization_id != current_user.organization_id:
        logger.warning(f"Permission denied: Task {task_id} belongs to org {task.organization_id}, user is in org {current_user.organization_id}")
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return task

@router.put("/{task_id}", response_model=Task)
def update_task(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    task_id: int,
    task_in: TaskUpdate,
) -> Any:
    """
    Update a task.
    """
    task = crud_task.task.get(db, task_id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if the user has permission to update this task
    if not current_user.is_admin and task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if task is being completed
    task_completed = False
    if task_in.status and task_in.status == "COMPLETED" and task.status != "COMPLETED":
        task_completed = True
    
    # Update the task
    task = crud_task.task.update(db, db_obj=task, obj_in=task_in)
    
    # Log activity for task update (non-blocking; fix sequence if UniqueViolation)
    try:
        from app.models.activity import Activity, ActivityType

        lead_id = getattr(task, "lead_id", None)
        deal_id = getattr(task, "deal_id", None)

        if task_completed:
            activity_type = ActivityType.TASK_COMPLETED
            description = f"Task completed: {task.title}"
        else:
            activity_type = ActivityType.NOTE
            description = f"Task updated: {task.title}"

        activity = Activity(
            type=activity_type,
            description=description,
            user_id=current_user.id,
            organization_id=task.organization_id,
            lead_id=lead_id,
            deal_id=deal_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
    except IntegrityError as e:
        db.rollback()
        if "activities_pkey" in str(e) or "UniqueViolation" in str(e):
            try:
                db.execute(text(
                    "SELECT setval(pg_get_serial_sequence('activities', 'id'), COALESCE((SELECT MAX(id) FROM activities), 1))"
                ))
                db.commit()
            except Exception as seq_e:
                logger.warning("Could not reset activities sequence: %s", seq_e)
        logger.warning("Activity creation failed for task update: %s", e)
    except Exception as e:
        db.rollback()
        logger.warning("Error creating activity for task update: %s", e)

    return task

@router.delete("/{task_id}", response_model=Task)
def delete_task(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    task_id: int,
) -> Task:
    """
    Delete task.
    """
    task = crud_task.task.get(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    task = crud_task.task.remove(db, id=task_id)
    return task

@router.get("/overdue", response_model=List[Task])
def get_overdue_tasks(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[Task]:
    """
    Get overdue tasks.
    """
    if current_user.is_admin:
        user_id = None
    else:
        user_id = current_user.id
    
    return crud_task.task.get_overdue_tasks(db, user_id=user_id)

@router.get("/upcoming", response_model=List[Task])
def get_upcoming_tasks(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    days: int = Query(7, ge=1, le=30),
) -> List[Task]:
    """
    Get upcoming tasks for the next X days.
    """
    if current_user.is_admin:
        user_id = None
    else:
        user_id = current_user.id
    
    return crud_task.task.get_upcoming_tasks(db, user_id=user_id, days=days)

@router.post("/{task_id}/complete", response_model=Task)
def complete_task(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    task_id: int,
) -> Any:
    """
    Mark a task as completed.
    """
    task = crud_task.task.get(db, id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if the user has permission to update this task
    if not current_user.is_admin and task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Update the task status to completed
    from app.models.task import TaskStatus
    task_in = TaskUpdate(status=TaskStatus.COMPLETED)
    task = crud_task.task.update(db, db_obj=task, obj_in=task_in)
    
    # Log activity for task completion
    try:
        # Create activity for task completion
        from app.models.activity import Activity, ActivityType
        
        # Determine related entity
        lead_id = task.lead_id if hasattr(task, 'lead_id') else None
        deal_id = task.deal_id if hasattr(task, 'deal_id') else None
        
        activity = Activity(
            type=ActivityType.TASK_COMPLETED,
            description=f"Task completed: {task.title}",
            user_id=current_user.id,
            organization_id=task.organization_id,
            lead_id=lead_id,
            deal_id=deal_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(activity)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error creating activity for task completion: {str(e)}")
    
    return task
