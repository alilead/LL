from sqlalchemy import Column, Integer, ForeignKey, DateTime, Table, func, text
from app.models.base import Base

# User-Role association table
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now())
)

# Role-Permission association table
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now())
)

# Lead-Tag association table
lead_tags = Table(
    "lead_tags",
    Base.metadata,
    Column("lead_id", Integer, ForeignKey("leads.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
    Column("organization_id", Integer, ForeignKey("organizations.id"), nullable=False),
    Column("created_at", DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
)
