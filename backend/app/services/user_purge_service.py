"""
Hard-delete all users except the protected admin account.
Deletes dependent rows first to satisfy FK constraints, then removes user rows.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Sequence

from sqlalchemy import bindparam, func, or_, text
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.workflow import Workflow, WorkflowExecution

logger = logging.getLogger(__name__)

PROTECTED_EMAIL = "ali@the-leadlab.com"
TOMBSTONE_EMAIL_SUFFIX = "@deleted.local"
TOMBSTONE_EMAIL_PREFIX = "deleted+user-"


def is_tombstone_user(user: User) -> bool:
    """True for soft-deleted users kept only for FK integrity."""
    email = (user.email or "").strip().lower()
    if not email or email == PROTECTED_EMAIL.lower():
        return False
    return email.endswith(TOMBSTONE_EMAIL_SUFFIX) or email.startswith(TOMBSTONE_EMAIL_PREFIX)


def _delete_in(db: Session, sql: str, ids: List[int]) -> None:
    if not ids:
        return
    stmt = text(sql).bindparams(bindparam("ids", expanding=True))
    try:
        db.execute(stmt, {"ids": ids})
    except Exception as exc:
        err = str(exc).lower()
        if "doesn't exist" in err or "does not exist" in err or "unknown table" in err:
            logger.warning("Purge skip (missing table): %s", sql[:70])
            return
        raise


def _delete_workflows_for_users(db: Session, ids: List[int]) -> None:
    if not ids:
        return
    wf_ids = [
        row[0]
        for row in db.query(Workflow.id)
        .filter(
            or_(
                Workflow.created_by_id.in_(ids),
                Workflow.updated_by_id.in_(ids),
                Workflow.run_as_user_id.in_(ids),
            )
        )
        .all()
    ]
    if not wf_ids:
        return
    db.query(WorkflowExecution).filter(WorkflowExecution.workflow_id.in_(wf_ids)).delete(
        synchronize_session=False
    )
    db.query(Workflow).filter(Workflow.id.in_(wf_ids)).delete(synchronize_session=False)


def _run_deletes(db: Session, ids: List[int]) -> None:
    """Ordered deletes — children before users."""
    statements = [
        "DELETE FROM messages WHERE sender_id IN :ids",
        "DELETE FROM messages WHERE receiver_id IN :ids",
        "DELETE FROM notifications WHERE user_id IN :ids",
        "DELETE FROM event_attendees WHERE user_id IN :ids",
        "DELETE FROM events WHERE user_id IN :ids OR created_by IN :ids",
        "DELETE FROM activities WHERE user_id IN :ids",
        "DELETE FROM communications WHERE user_id IN :ids",
        "DELETE FROM files WHERE user_id IN :ids",
        "DELETE FROM information_requests WHERE requested_by IN :ids",
        "DELETE FROM notes WHERE created_by_id IN :ids",
        "DELETE FROM leads WHERE user_id IN :ids OR created_by IN :ids",
        "DELETE FROM tasks WHERE assigned_to_id IN :ids",
        "DELETE FROM deals WHERE assigned_to_id IN :ids",
        "DELETE FROM opportunities WHERE user_id IN :ids",
        "DELETE FROM email_logs WHERE user_id IN :ids",
        "DELETE FROM email_accounts WHERE user_id IN :ids",
        "DELETE FROM calendar_integrations WHERE user_id IN :ids",
        "DELETE FROM calendar_event_links WHERE user_id IN :ids",
        "DELETE FROM api_tokens WHERE user_id IN :ids",
        "DELETE FROM linkedin_connections WHERE user_id IN :ids",
        "DELETE FROM linkedin_interactions WHERE user_id IN :ids",
        "DELETE FROM user_settings WHERE user_id IN :ids",
        "DELETE FROM settings WHERE user_id IN :ids",
        "DELETE FROM tokens WHERE user_id IN :ids",
        "DELETE FROM territory_members WHERE user_id IN :ids",
        "DELETE FROM territory_assignments WHERE assigned_by_user_id IN :ids",
        "DELETE FROM forecasts WHERE user_id IN :ids OR adjusted_by_id IN :ids",
        "DELETE FROM forecast_comments WHERE user_id IN :ids",
        "DELETE FROM team_invitations WHERE invited_by_id IN :ids",
        "DELETE FROM reports WHERE user_id IN :ids",
        "DELETE FROM approval_steps WHERE approver_id IN :ids",
        "DELETE FROM conversations WHERE user_id IN :ids",
        "DELETE FROM dashboards WHERE created_by_id IN :ids",
        "DELETE FROM email_sequences WHERE created_by_id IN :ids",
        "DELETE FROM transactions WHERE user_id IN :ids",
        "DELETE FROM ai_insights WHERE user_id IN :ids",
        "DELETE FROM user_roles WHERE user_id IN :ids",
    ]
    for sql in statements:
        _delete_in(db, sql, ids)
    _delete_workflows_for_users(db, ids)


def hard_delete_all_except_ali(db: Session) -> dict:
    """Permanently delete every user except ali@the-leadlab.com."""
    ali = (
        db.query(User)
        .filter(func.lower(User.email) == PROTECTED_EMAIL.lower())
        .first()
    )
    if not ali:
        raise ValueError(f"Protected user {PROTECTED_EMAIL} not found")

    ali.role = "admin"
    ali.is_superuser = True
    ali.is_active = True
    ali.updated_at = datetime.utcnow()
    db.flush()

    other_ids = [row[0] for row in db.query(User.id).filter(User.id != ali.id).all()]
    if not other_ids:
        db.commit()
        return {
            "success": True,
            "affected": 0,
            "message": f"No other users to delete. Kept {PROTECTED_EMAIL}.",
            "kept_user_id": ali.id,
        }

    _run_deletes(db, other_ids)
    deleted = db.query(User).filter(User.id.in_(other_ids)).delete(synchronize_session=False)
    db.commit()

    return {
        "success": True,
        "affected": deleted,
        "message": f"Permanently deleted {deleted} user(s). Kept {PROTECTED_EMAIL} (id={ali.id}).",
        "kept_user_id": ali.id,
    }
