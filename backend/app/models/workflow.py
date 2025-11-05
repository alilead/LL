"""
Visual Workflow Builder Models

Enterprise workflow automation with visual builder.
Supports:
- Trigger-based workflows (record created/updated, time-based, webhook)
- Conditional logic (if/then/else branching)
- Multiple action types (update field, send email, create task, call webhook, etc.)
- Approval workflows
- Cross-object workflows
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, JSON, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum


class WorkflowTriggerType(str, enum.Enum):
    """Workflow trigger types"""
    RECORD_CREATED = "record_created"
    RECORD_UPDATED = "record_updated"
    RECORD_DELETED = "record_deleted"
    FIELD_CHANGED = "field_changed"
    TIME_BASED = "time_based"
    WEBHOOK = "webhook"
    MANUAL = "manual"


class WorkflowStatus(str, enum.Enum):
    """Workflow status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"


class WorkflowExecutionStatus(str, enum.Enum):
    """Workflow execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ActionType(str, enum.Enum):
    """Workflow action types"""
    UPDATE_FIELD = "update_field"
    CREATE_RECORD = "create_record"
    DELETE_RECORD = "delete_record"
    SEND_EMAIL = "send_email"
    CREATE_TASK = "create_task"
    CALL_WEBHOOK = "call_webhook"
    ASSIGN_USER = "assign_user"
    CHANGE_OWNER = "change_owner"
    ADD_TO_SEQUENCE = "add_to_sequence"
    SEND_NOTIFICATION = "send_notification"
    APPROVAL_REQUEST = "approval_request"
    WAIT = "wait"
    CONDITION = "condition"


class Workflow(Base):
    """
    Workflow definition with visual flow.
    """
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Organization
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    # Trigger configuration
    trigger_type = Column(SQLEnum(WorkflowTriggerType), nullable=False)
    trigger_object = Column(String(50), nullable=False)  # lead, account, opportunity, etc.
    trigger_config = Column(JSON, nullable=True)  # Additional trigger configuration

    # Entry criteria (conditions that must be met to trigger)
    entry_criteria = Column(JSON, nullable=True)

    # Visual flow definition (nodes and edges)
    flow_definition = Column(JSON, nullable=False)  # {nodes: [], edges: []}

    # Status
    status = Column(SQLEnum(WorkflowStatus), default=WorkflowStatus.DRAFT)
    is_active = Column(Boolean, default=False)

    # Execution settings
    run_as_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Execute as this user
    max_executions_per_hour = Column(Integer, default=100)  # Rate limiting

    # Metadata
    version = Column(Integer, default=1)
    metadata = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="workflows")
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    run_as_user = relationship("User", foreign_keys=[run_as_user_id])
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Workflow {self.name}>"


class WorkflowExecution(Base):
    """
    Tracks individual workflow executions.
    """
    __tablename__ = "workflow_executions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False, index=True)

    # Execution details
    status = Column(SQLEnum(WorkflowExecutionStatus), default=WorkflowExecutionStatus.PENDING, index=True)
    triggered_by = Column(String(100), nullable=True)  # user_id, system, webhook, etc.

    # Context
    trigger_record_type = Column(String(50), nullable=True)  # lead, account, etc.
    trigger_record_id = Column(Integer, nullable=True)
    context_data = Column(JSON, nullable=True)  # Data passed to workflow

    # Execution log
    execution_log = Column(JSON, nullable=True)  # Log of actions taken
    error_message = Column(Text, nullable=True)

    # Timing
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)  # Execution duration in milliseconds

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    workflow = relationship("Workflow", back_populates="executions")
    actions = relationship("WorkflowActionExecution", back_populates="execution", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<WorkflowExecution {self.id} - Workflow {self.workflow_id}>"


class WorkflowActionExecution(Base):
    """
    Tracks individual action executions within a workflow.
    """
    __tablename__ = "workflow_action_executions"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("workflow_executions.id"), nullable=False, index=True)

    # Action details
    action_node_id = Column(String(100), nullable=False)  # Node ID from flow definition
    action_type = Column(SQLEnum(ActionType), nullable=False)
    action_config = Column(JSON, nullable=False)

    # Status
    status = Column(SQLEnum(WorkflowExecutionStatus), default=WorkflowExecutionStatus.PENDING)
    error_message = Column(Text, nullable=True)

    # Result
    result_data = Column(JSON, nullable=True)

    # Timing
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    execution = relationship("WorkflowExecution", back_populates="actions")

    def __repr__(self):
        return f"<WorkflowActionExecution {self.id} - {self.action_type}>"


class ApprovalProcess(Base):
    """
    Approval workflow configuration.
    """
    __tablename__ = "approval_processes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Organization
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    # Target object
    object_type = Column(String(50), nullable=False)  # lead, deal, quote, etc.

    # Entry criteria
    entry_criteria = Column(JSON, nullable=True)

    # Approval steps (ordered list)
    approval_steps = Column(JSON, nullable=False)
    # Example: [
    #   {"step": 1, "name": "Manager Approval", "approver_role": "manager", "required": true},
    #   {"step": 2, "name": "Director Approval", "approver_role": "director", "required": true}
    # ]

    # Actions
    approval_actions = Column(JSON, nullable=True)  # Actions to take on approval
    rejection_actions = Column(JSON, nullable=True)  # Actions to take on rejection

    # Settings
    is_active = Column(Boolean, default=True)
    allow_parallel = Column(Boolean, default=False)  # Allow parallel approvals
    auto_approve_threshold = Column(Float, nullable=True)  # Auto-approve if below threshold

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    organization = relationship("Organization")
    created_by = relationship("User")
    requests = relationship("ApprovalRequest", back_populates="process", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ApprovalProcess {self.name}>"


class ApprovalRequest(Base):
    """
    Individual approval request instance.
    """
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("approval_processes.id"), nullable=False, index=True)

    # Request details
    record_type = Column(String(50), nullable=False)
    record_id = Column(Integer, nullable=False, index=True)

    # Status
    status = Column(String(50), default="pending", index=True)  # pending, approved, rejected, recalled
    current_step = Column(Integer, default=1)

    # Requester
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comments = Column(Text, nullable=True)

    # Context
    context_data = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    process = relationship("ApprovalProcess", back_populates="requests")
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    steps = relationship("ApprovalStep", back_populates="request", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ApprovalRequest {self.id} - {self.status}>"


class ApprovalStep(Base):
    """
    Individual approval step within a request.
    """
    __tablename__ = "approval_steps"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("approval_requests.id"), nullable=False, index=True)

    # Step details
    step_number = Column(Integer, nullable=False)
    step_name = Column(String(255), nullable=False)

    # Approver
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    # Response
    status = Column(String(50), default="pending")  # pending, approved, rejected
    responded_at = Column(DateTime, nullable=True)
    comments = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    request = relationship("ApprovalRequest", back_populates="steps")
    approver = relationship("User")

    def __repr__(self):
        return f"<ApprovalStep {self.step_number} - {self.status}>"
