"""
CRUD operations for Workflow Management and Execution
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta

from app.models.workflow import (
    Workflow, WorkflowExecution, WorkflowActionExecution,
    ApprovalProcess, ApprovalRequest, ApprovalStep,
    WorkflowStatus, WorkflowExecutionStatus
)
from app.schemas.workflow import (
    WorkflowCreate, WorkflowUpdate,
    ApprovalProcessCreate, ApprovalRequestCreate
)


class CRUDWorkflow:
    """CRUD operations for Workflow"""

    def get(self, db: Session, workflow_id: int) -> Optional[Workflow]:
        """Get workflow by ID"""
        return db.query(Workflow).filter(Workflow.id == workflow_id).first()

    def get_multi(
        self,
        db: Session,
        *,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[WorkflowStatus] = None,
        is_active: Optional[bool] = None,
        trigger_object: Optional[str] = None
    ) -> List[Workflow]:
        """Get multiple workflows"""
        query = db.query(Workflow).filter(Workflow.organization_id == organization_id)

        if status:
            query = query.filter(Workflow.status == status)
        if is_active is not None:
            query = query.filter(Workflow.is_active == is_active)
        if trigger_object:
            query = query.filter(Workflow.trigger_object == trigger_object)

        return query.order_by(desc(Workflow.updated_at)).offset(skip).limit(limit).all()

    def create(
        self,
        db: Session,
        *,
        obj_in: WorkflowCreate,
        organization_id: int,
        created_by_id: int
    ) -> Workflow:
        """Create new workflow"""
        workflow = Workflow(
            **obj_in.dict(),
            organization_id=organization_id,
            created_by_id=created_by_id
        )
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        return workflow

    def update(
        self,
        db: Session,
        *,
        workflow: Workflow,
        obj_in: WorkflowUpdate,
        updated_by_id: int
    ) -> Workflow:
        """Update workflow"""
        update_data = obj_in.dict(exclude_unset=True)

        for field, value in update_data.items():
            setattr(workflow, field, value)

        workflow.updated_at = datetime.utcnow()
        workflow.updated_by_id = updated_by_id
        workflow.version += 1

        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        return workflow

    def delete(self, db: Session, *, workflow_id: int) -> bool:
        """Delete workflow (soft delete by setting inactive)"""
        workflow = self.get(db, workflow_id)
        if workflow:
            workflow.is_active = False
            workflow.status = WorkflowStatus.INACTIVE
            workflow.updated_at = datetime.utcnow()
            db.add(workflow)
            db.commit()
            return True
        return False

    def activate(self, db: Session, *, workflow_id: int) -> Workflow:
        """Activate a workflow"""
        workflow = self.get(db, workflow_id)
        if workflow:
            workflow.is_active = True
            workflow.status = WorkflowStatus.ACTIVE
            workflow.updated_at = datetime.utcnow()
            db.add(workflow)
            db.commit()
            db.refresh(workflow)
        return workflow

    def deactivate(self, db: Session, *, workflow_id: int) -> Workflow:
        """Deactivate a workflow"""
        workflow = self.get(db, workflow_id)
        if workflow:
            workflow.is_active = False
            workflow.status = WorkflowStatus.INACTIVE
            workflow.updated_at = datetime.utcnow()
            db.add(workflow)
            db.commit()
            db.refresh(workflow)
        return workflow

    def get_statistics(self, db: Session, workflow_id: int) -> Dict[str, Any]:
        """Get workflow execution statistics"""
        workflow = self.get(db, workflow_id)
        if not workflow:
            return {}

        total = db.query(func.count(WorkflowExecution.id)).filter(
            WorkflowExecution.workflow_id == workflow_id
        ).scalar()

        successful = db.query(func.count(WorkflowExecution.id)).filter(
            and_(
                WorkflowExecution.workflow_id == workflow_id,
                WorkflowExecution.status == WorkflowExecutionStatus.COMPLETED
            )
        ).scalar()

        failed = db.query(func.count(WorkflowExecution.id)).filter(
            and_(
                WorkflowExecution.workflow_id == workflow_id,
                WorkflowExecution.status == WorkflowExecutionStatus.FAILED
            )
        ).scalar()

        pending = db.query(func.count(WorkflowExecution.id)).filter(
            and_(
                WorkflowExecution.workflow_id == workflow_id,
                WorkflowExecution.status.in_([WorkflowExecutionStatus.PENDING, WorkflowExecutionStatus.RUNNING])
            )
        ).scalar()

        # Average duration
        avg_duration = db.query(func.avg(WorkflowExecution.duration_ms)).filter(
            and_(
                WorkflowExecution.workflow_id == workflow_id,
                WorkflowExecution.status == WorkflowExecutionStatus.COMPLETED
            )
        ).scalar() or 0

        # Last execution
        last_execution = db.query(WorkflowExecution).filter(
            WorkflowExecution.workflow_id == workflow_id
        ).order_by(desc(WorkflowExecution.created_at)).first()

        # Time-based counts
        now = datetime.utcnow()
        today_count = db.query(func.count(WorkflowExecution.id)).filter(
            and_(
                WorkflowExecution.workflow_id == workflow_id,
                WorkflowExecution.created_at >= now.replace(hour=0, minute=0, second=0, microsecond=0)
            )
        ).scalar()

        week_ago = now - timedelta(days=7)
        week_count = db.query(func.count(WorkflowExecution.id)).filter(
            and_(
                WorkflowExecution.workflow_id == workflow_id,
                WorkflowExecution.created_at >= week_ago
            )
        ).scalar()

        month_ago = now - timedelta(days=30)
        month_count = db.query(func.count(WorkflowExecution.id)).filter(
            and_(
                WorkflowExecution.workflow_id == workflow_id,
                WorkflowExecution.created_at >= month_ago
            )
        ).scalar()

        success_rate = (successful / total * 100) if total > 0 else 0

        return {
            "workflow_id": workflow_id,
            "workflow_name": workflow.name,
            "total_executions": total,
            "successful_executions": successful,
            "failed_executions": failed,
            "pending_executions": pending,
            "avg_duration_ms": float(avg_duration),
            "success_rate": success_rate,
            "last_executed_at": last_execution.created_at if last_execution else None,
            "executions_today": today_count,
            "executions_this_week": week_count,
            "executions_this_month": month_count
        }


class CRUDWorkflowExecution:
    """CRUD operations for Workflow Execution"""

    def get(self, db: Session, execution_id: int) -> Optional[WorkflowExecution]:
        """Get execution by ID"""
        return db.query(WorkflowExecution).filter(WorkflowExecution.id == execution_id).first()

    def get_by_workflow(
        self,
        db: Session,
        workflow_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[WorkflowExecutionStatus] = None
    ) -> List[WorkflowExecution]:
        """Get executions for a workflow"""
        query = db.query(WorkflowExecution).filter(WorkflowExecution.workflow_id == workflow_id)

        if status:
            query = query.filter(WorkflowExecution.status == status)

        return query.order_by(desc(WorkflowExecution.created_at)).offset(skip).limit(limit).all()

    def create(
        self,
        db: Session,
        *,
        workflow_id: int,
        triggered_by: Optional[str] = None,
        trigger_record_type: Optional[str] = None,
        trigger_record_id: Optional[int] = None,
        context_data: Optional[Dict[str, Any]] = None
    ) -> WorkflowExecution:
        """Create new workflow execution"""
        execution = WorkflowExecution(
            workflow_id=workflow_id,
            triggered_by=triggered_by,
            trigger_record_type=trigger_record_type,
            trigger_record_id=trigger_record_id,
            context_data=context_data,
            status=WorkflowExecutionStatus.PENDING
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)
        return execution

    def start(self, db: Session, *, execution: WorkflowExecution) -> WorkflowExecution:
        """Mark execution as started"""
        execution.status = WorkflowExecutionStatus.RUNNING
        execution.started_at = datetime.utcnow()
        db.add(execution)
        db.commit()
        db.refresh(execution)
        return execution

    def complete(
        self,
        db: Session,
        *,
        execution: WorkflowExecution,
        execution_log: Optional[List[Dict[str, Any]]] = None
    ) -> WorkflowExecution:
        """Mark execution as completed"""
        execution.status = WorkflowExecutionStatus.COMPLETED
        execution.completed_at = datetime.utcnow()
        if execution.started_at:
            duration = (execution.completed_at - execution.started_at).total_seconds() * 1000
            execution.duration_ms = int(duration)
        if execution_log:
            execution.execution_log = execution_log
        db.add(execution)
        db.commit()
        db.refresh(execution)
        return execution

    def fail(
        self,
        db: Session,
        *,
        execution: WorkflowExecution,
        error_message: str,
        execution_log: Optional[List[Dict[str, Any]]] = None
    ) -> WorkflowExecution:
        """Mark execution as failed"""
        execution.status = WorkflowExecutionStatus.FAILED
        execution.completed_at = datetime.utcnow()
        execution.error_message = error_message
        if execution.started_at:
            duration = (execution.completed_at - execution.started_at).total_seconds() * 1000
            execution.duration_ms = int(duration)
        if execution_log:
            execution.execution_log = execution_log
        db.add(execution)
        db.commit()
        db.refresh(execution)
        return execution

    def add_log_entry(
        self,
        db: Session,
        *,
        execution: WorkflowExecution,
        log_entry: Dict[str, Any]
    ) -> WorkflowExecution:
        """Add entry to execution log"""
        if not execution.execution_log:
            execution.execution_log = []
        execution.execution_log.append(log_entry)
        db.add(execution)
        db.commit()
        db.refresh(execution)
        return execution


class CRUDApprovalProcess:
    """CRUD operations for Approval Process"""

    def get(self, db: Session, process_id: int) -> Optional[ApprovalProcess]:
        """Get approval process by ID"""
        return db.query(ApprovalProcess).filter(ApprovalProcess.id == process_id).first()

    def get_multi(
        self,
        db: Session,
        *,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
        object_type: Optional[str] = None
    ) -> List[ApprovalProcess]:
        """Get multiple approval processes"""
        query = db.query(ApprovalProcess).filter(
            ApprovalProcess.organization_id == organization_id
        )

        if is_active is not None:
            query = query.filter(ApprovalProcess.is_active == is_active)
        if object_type:
            query = query.filter(ApprovalProcess.object_type == object_type)

        return query.order_by(desc(ApprovalProcess.created_at)).offset(skip).limit(limit).all()

    def create(
        self,
        db: Session,
        *,
        obj_in: ApprovalProcessCreate,
        organization_id: int,
        created_by_id: int
    ) -> ApprovalProcess:
        """Create new approval process"""
        # Convert approval steps to dict format
        approval_steps = [step.dict() for step in obj_in.approval_steps]

        process = ApprovalProcess(
            name=obj_in.name,
            description=obj_in.description,
            object_type=obj_in.object_type,
            entry_criteria=obj_in.entry_criteria,
            approval_steps=approval_steps,
            approval_actions=obj_in.approval_actions,
            rejection_actions=obj_in.rejection_actions,
            is_active=obj_in.is_active,
            allow_parallel=obj_in.allow_parallel,
            auto_approve_threshold=obj_in.auto_approve_threshold,
            organization_id=organization_id,
            created_by_id=created_by_id
        )
        db.add(process)
        db.commit()
        db.refresh(process)
        return process

    def update(
        self,
        db: Session,
        *,
        process: ApprovalProcess,
        obj_in: Dict[str, Any]
    ) -> ApprovalProcess:
        """Update approval process"""
        # Convert approval steps if provided
        if "approval_steps" in obj_in and obj_in["approval_steps"]:
            obj_in["approval_steps"] = [
                step.dict() if hasattr(step, 'dict') else step
                for step in obj_in["approval_steps"]
            ]

        for field, value in obj_in.items():
            setattr(process, field, value)

        process.updated_at = datetime.utcnow()
        db.add(process)
        db.commit()
        db.refresh(process)
        return process

    def delete(self, db: Session, *, process_id: int) -> bool:
        """Delete approval process"""
        process = self.get(db, process_id)
        if process:
            db.delete(process)
            db.commit()
            return True
        return False

    def get_statistics(self, db: Session, process_id: int) -> Dict[str, Any]:
        """Get approval process statistics"""
        total = db.query(func.count(ApprovalRequest.id)).filter(
            ApprovalRequest.process_id == process_id
        ).scalar()

        approved = db.query(func.count(ApprovalRequest.id)).filter(
            and_(
                ApprovalRequest.process_id == process_id,
                ApprovalRequest.status == "approved"
            )
        ).scalar()

        rejected = db.query(func.count(ApprovalRequest.id)).filter(
            and_(
                ApprovalRequest.process_id == process_id,
                ApprovalRequest.status == "rejected"
            )
        ).scalar()

        pending = db.query(func.count(ApprovalRequest.id)).filter(
            and_(
                ApprovalRequest.process_id == process_id,
                ApprovalRequest.status == "pending"
            )
        ).scalar()

        return {
            "total_requests": total,
            "approved_count": approved,
            "rejected_count": rejected,
            "pending_count": pending
        }


class CRUDApprovalRequest:
    """CRUD operations for Approval Request"""

    def get(self, db: Session, request_id: int) -> Optional[ApprovalRequest]:
        """Get approval request by ID"""
        return db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()

    def get_by_process(
        self,
        db: Session,
        process_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[ApprovalRequest]:
        """Get approval requests for a process"""
        query = db.query(ApprovalRequest).filter(ApprovalRequest.process_id == process_id)

        if status:
            query = query.filter(ApprovalRequest.status == status)

        return query.order_by(desc(ApprovalRequest.created_at)).offset(skip).limit(limit).all()

    def get_pending_for_user(
        self,
        db: Session,
        user_id: int,
        organization_id: int
    ) -> List[ApprovalRequest]:
        """Get pending approval requests for a user"""
        return db.query(ApprovalRequest).join(ApprovalStep).filter(
            and_(
                ApprovalStep.approver_id == user_id,
                ApprovalStep.status == "pending",
                ApprovalRequest.status == "pending"
            )
        ).all()

    def create(
        self,
        db: Session,
        *,
        obj_in: ApprovalRequestCreate,
        requested_by_id: int
    ) -> ApprovalRequest:
        """Create new approval request and initialize steps"""
        request = ApprovalRequest(
            **obj_in.dict(),
            requested_by_id=requested_by_id,
            status="pending",
            current_step=1
        )
        db.add(request)
        db.flush()  # Get the ID

        # Create approval steps from process definition
        process = db.query(ApprovalProcess).filter(ApprovalProcess.id == obj_in.process_id).first()
        if process and process.approval_steps:
            for step_config in process.approval_steps:
                # Determine approver
                approver_id = step_config.get("approver_id")
                # If no specific approver, would need to determine based on role
                # For now, we'll require explicit approver_id

                if approver_id:
                    step = ApprovalStep(
                        request_id=request.id,
                        step_number=step_config["step"],
                        step_name=step_config["name"],
                        approver_id=approver_id,
                        status="pending" if step_config["step"] == 1 else "pending"
                    )
                    db.add(step)

        db.commit()
        db.refresh(request)
        return request

    def approve_step(
        self,
        db: Session,
        *,
        request: ApprovalRequest,
        step: ApprovalStep,
        comments: Optional[str] = None
    ) -> ApprovalRequest:
        """Approve a step and move to next or complete"""
        step.status = "approved"
        step.responded_at = datetime.utcnow()
        step.comments = comments
        db.add(step)

        # Check if this was the last step
        total_steps = db.query(func.count(ApprovalStep.id)).filter(
            ApprovalStep.request_id == request.id
        ).scalar()

        if request.current_step >= total_steps:
            # All steps completed - approve request
            request.status = "approved"
            request.completed_at = datetime.utcnow()
        else:
            # Move to next step
            request.current_step += 1

        request.updated_at = datetime.utcnow()
        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    def reject_step(
        self,
        db: Session,
        *,
        request: ApprovalRequest,
        step: ApprovalStep,
        comments: Optional[str] = None
    ) -> ApprovalRequest:
        """Reject a step and complete request as rejected"""
        step.status = "rejected"
        step.responded_at = datetime.utcnow()
        step.comments = comments
        db.add(step)

        request.status = "rejected"
        request.completed_at = datetime.utcnow()
        request.updated_at = datetime.utcnow()
        db.add(request)
        db.commit()
        db.refresh(request)
        return request


# Create instances
crud_workflow = CRUDWorkflow()
crud_workflow_execution = CRUDWorkflowExecution()
crud_approval_process = CRUDApprovalProcess()
crud_approval_request = CRUDApprovalRequest()
