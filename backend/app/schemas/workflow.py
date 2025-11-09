"""
Workflow schemas for API requests and responses
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class WorkflowTriggerType(str, Enum):
    """Workflow trigger types"""
    RECORD_CREATED = "record_created"
    RECORD_UPDATED = "record_updated"
    RECORD_DELETED = "record_deleted"
    FIELD_CHANGED = "field_changed"
    TIME_BASED = "time_based"
    WEBHOOK = "webhook"
    MANUAL = "manual"


class WorkflowStatus(str, Enum):
    """Workflow status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"


class WorkflowExecutionStatus(str, Enum):
    """Workflow execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ActionType(str, Enum):
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


# Workflow Schemas

class FlowNode(BaseModel):
    """Visual flow node"""
    id: str
    type: str  # trigger, action, condition, approval
    label: str
    position: Dict[str, float]  # {x: 100, y: 200}
    data: Dict[str, Any]  # Node-specific configuration


class FlowEdge(BaseModel):
    """Visual flow edge (connection)"""
    id: str
    source: str  # Source node ID
    target: str  # Target node ID
    label: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class FlowDefinition(BaseModel):
    """Complete flow definition"""
    nodes: List[FlowNode]
    edges: List[FlowEdge]


class WorkflowBase(BaseModel):
    """Base workflow schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    trigger_type: WorkflowTriggerType
    trigger_object: str  # lead, account, opportunity, etc.
    trigger_config: Optional[Dict[str, Any]] = None
    entry_criteria: Optional[Dict[str, Any]] = None
    flow_definition: FlowDefinition
    status: WorkflowStatus = WorkflowStatus.DRAFT
    is_active: bool = False
    run_as_user_id: Optional[int] = None
    max_executions_per_hour: int = 100
    metadata: Optional[Dict[str, Any]] = None


class WorkflowCreate(WorkflowBase):
    """Schema for creating a workflow"""
    pass


class WorkflowUpdate(BaseModel):
    """Schema for updating a workflow"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    trigger_type: Optional[WorkflowTriggerType] = None
    trigger_object: Optional[str] = None
    trigger_config: Optional[Dict[str, Any]] = None
    entry_criteria: Optional[Dict[str, Any]] = None
    flow_definition: Optional[FlowDefinition] = None
    status: Optional[WorkflowStatus] = None
    is_active: Optional[bool] = None
    run_as_user_id: Optional[int] = None
    max_executions_per_hour: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class WorkflowResponse(WorkflowBase):
    """Schema for workflow response"""
    id: int
    organization_id: int
    version: int
    created_at: datetime
    updated_at: datetime
    created_by_id: int
    updated_by_id: Optional[int] = None

    # Statistics
    total_executions: int = 0
    successful_executions: int = 0
    failed_executions: int = 0
    last_executed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkflowListResponse(BaseModel):
    """Simplified workflow list response"""
    id: int
    name: str
    description: Optional[str] = None
    trigger_type: WorkflowTriggerType
    trigger_object: str
    status: WorkflowStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime
    total_executions: int = 0
    last_executed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Workflow Execution Schemas

class WorkflowExecutionBase(BaseModel):
    """Base workflow execution schema"""
    triggered_by: Optional[str] = None
    trigger_record_type: Optional[str] = None
    trigger_record_id: Optional[int] = None
    context_data: Optional[Dict[str, Any]] = None


class WorkflowExecutionCreate(WorkflowExecutionBase):
    """Schema for creating a workflow execution"""
    workflow_id: int


class WorkflowExecutionResponse(WorkflowExecutionBase):
    """Schema for workflow execution response"""
    id: int
    workflow_id: int
    status: WorkflowExecutionStatus
    execution_log: Optional[List[Dict[str, Any]]] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowActionExecutionResponse(BaseModel):
    """Schema for action execution response"""
    id: int
    execution_id: int
    action_node_id: str
    action_type: ActionType
    action_config: Dict[str, Any]
    status: WorkflowExecutionStatus
    error_message: Optional[str] = None
    result_data: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Approval Process Schemas

class ApprovalStep(BaseModel):
    """Approval step configuration"""
    step: int
    name: str
    approver_role: Optional[str] = None
    approver_id: Optional[int] = None
    required: bool = True


class ApprovalProcessBase(BaseModel):
    """Base approval process schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    object_type: str  # lead, deal, quote, etc.
    entry_criteria: Optional[Dict[str, Any]] = None
    approval_steps: List[ApprovalStep]
    approval_actions: Optional[List[Dict[str, Any]]] = None
    rejection_actions: Optional[List[Dict[str, Any]]] = None
    is_active: bool = True
    allow_parallel: bool = False
    auto_approve_threshold: Optional[float] = None


class ApprovalProcessCreate(ApprovalProcessBase):
    """Schema for creating an approval process"""
    pass


class ApprovalProcessUpdate(BaseModel):
    """Schema for updating an approval process"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    object_type: Optional[str] = None
    entry_criteria: Optional[Dict[str, Any]] = None
    approval_steps: Optional[List[ApprovalStep]] = None
    approval_actions: Optional[List[Dict[str, Any]]] = None
    rejection_actions: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None
    allow_parallel: Optional[bool] = None
    auto_approve_threshold: Optional[float] = None


class ApprovalProcessResponse(ApprovalProcessBase):
    """Schema for approval process response"""
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime
    created_by_id: int

    # Statistics
    total_requests: int = 0
    approved_count: int = 0
    rejected_count: int = 0
    pending_count: int = 0

    class Config:
        from_attributes = True


# Approval Request Schemas

class ApprovalRequestBase(BaseModel):
    """Base approval request schema"""
    record_type: str
    record_id: int
    comments: Optional[str] = None
    context_data: Optional[Dict[str, Any]] = None


class ApprovalRequestCreate(ApprovalRequestBase):
    """Schema for creating an approval request"""
    process_id: int


class ApprovalRequestResponse(ApprovalRequestBase):
    """Schema for approval request response"""
    id: int
    process_id: int
    status: str  # pending, approved, rejected, recalled
    current_step: int
    requested_by_id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    # Include process details
    process_name: Optional[str] = None

    # Include current approver
    current_approver_id: Optional[int] = None
    current_approver_name: Optional[str] = None

    class Config:
        from_attributes = True


class ApprovalStepResponse(BaseModel):
    """Schema for approval step response"""
    id: int
    request_id: int
    step_number: int
    step_name: str
    approver_id: int
    approver_name: Optional[str] = None
    status: str  # pending, approved, rejected
    assigned_at: datetime
    responded_at: Optional[datetime] = None
    comments: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApprovalDecision(BaseModel):
    """Schema for approval decision"""
    decision: str = Field(..., pattern="^(approve|reject)$")  # Pydantic v2: regex → pattern
    comments: Optional[str] = None


# Workflow Statistics

class WorkflowStatistics(BaseModel):
    """Workflow execution statistics"""
    workflow_id: int
    workflow_name: str
    total_executions: int
    successful_executions: int
    failed_executions: int
    pending_executions: int
    avg_duration_ms: float
    success_rate: float
    last_executed_at: Optional[datetime] = None
    executions_today: int = 0
    executions_this_week: int = 0
    executions_this_month: int = 0


class OrganizationWorkflowStats(BaseModel):
    """Organization-wide workflow statistics"""
    total_workflows: int
    active_workflows: int
    total_executions: int
    total_executions_today: int
    avg_success_rate: float
    top_workflows: List[WorkflowStatistics] = []


# Manual Trigger Schema

class ManualTriggerRequest(BaseModel):
    """Schema for manually triggering a workflow"""
    trigger_record_type: Optional[str] = None
    trigger_record_id: Optional[int] = None
    context_data: Optional[Dict[str, Any]] = None
