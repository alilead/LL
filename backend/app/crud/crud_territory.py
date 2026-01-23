"""
CRUD operations for Territory Management
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from datetime import datetime

from app.models.territory import (
    Territory, TerritoryMember, TerritoryRule,
    TerritoryAssignment, TerritoryQuota
)
from app.models.user import User
from app.schemas.territory import (
    TerritoryCreate, TerritoryUpdate,
    TerritoryMemberCreate, TerritoryRuleCreate,
    TerritoryAssignmentCreate, TerritoryQuotaCreate
)


class CRUDTerritory:
    """CRUD operations for Territory"""

    def get(self, db: Session, territory_id: int) -> Optional[Territory]:
        """Get territory by ID"""
        return db.query(Territory).filter(Territory.id == territory_id).first()

    def get_multi(
        self,
        db: Session,
        *,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Territory]:
        """Get multiple territories"""
        query = db.query(Territory).filter(Territory.organization_id == organization_id)

        if is_active is not None:
            query = query.filter(Territory.is_active == is_active)

        return query.offset(skip).limit(limit).all()

    def get_hierarchy(self, db: Session, organization_id: int) -> List[Territory]:
        """Get territory hierarchy (root territories with children)"""
        return db.query(Territory).filter(
            and_(
                Territory.organization_id == organization_id,
                Territory.parent_id.is_(None)
            )
        ).options(joinedload(Territory.children)).all()

    def get_by_parent(self, db: Session, parent_id: int) -> List[Territory]:
        """Get territories by parent"""
        return db.query(Territory).filter(Territory.parent_id == parent_id).all()

    def create(
        self,
        db: Session,
        *,
        obj_in: TerritoryCreate,
        organization_id: int,
        created_by_id: int
    ) -> Territory:
        """Create new territory"""
        # Calculate path and level
        path = ""
        level = 0
        if obj_in.parent_id:
            parent = self.get(db, obj_in.parent_id)
            if parent:
                path = parent.full_path
                level = parent.level + 1

        territory = Territory(
            **obj_in.dict(),
            organization_id=organization_id,
            created_by_id=created_by_id,
            path=path,
            level=level
        )
        db.add(territory)
        db.commit()
        db.refresh(territory)
        return territory

    def update(
        self,
        db: Session,
        *,
        territory: Territory,
        obj_in: TerritoryUpdate
    ) -> Territory:
        """Update territory"""
        update_data = obj_in.dict(exclude_unset=True)

        # If parent changed, update path and level
        if "parent_id" in update_data:
            if update_data["parent_id"]:
                parent = self.get(db, update_data["parent_id"])
                if parent:
                    update_data["path"] = parent.full_path
                    update_data["level"] = parent.level + 1
            else:
                update_data["path"] = ""
                update_data["level"] = 0

        for field, value in update_data.items():
            setattr(territory, field, value)

        territory.updated_at = datetime.utcnow()
        db.add(territory)
        db.commit()
        db.refresh(territory)
        return territory

    def delete(self, db: Session, *, territory_id: int) -> bool:
        """Delete territory (soft delete by setting inactive)"""
        territory = self.get(db, territory_id)
        if territory:
            territory.is_active = False
            territory.updated_at = datetime.utcnow()
            db.add(territory)
            db.commit()
            return True
        return False

    def get_members(self, db: Session, territory_id: int) -> List[TerritoryMember]:
        """Get all members of a territory"""
        return db.query(TerritoryMember).filter(
            TerritoryMember.territory_id == territory_id
        ).all()

    def add_member(
        self,
        db: Session,
        *,
        territory_id: int,
        obj_in: TerritoryMemberCreate
    ) -> TerritoryMember:
        """Add member to territory"""
        member = TerritoryMember(
            territory_id=territory_id,
            **obj_in.dict()
        )
        db.add(member)
        db.commit()
        db.refresh(member)
        return member

    def remove_member(self, db: Session, *, member_id: int) -> bool:
        """Remove member from territory"""
        member = db.query(TerritoryMember).filter(TerritoryMember.id == member_id).first()
        if member:
            db.delete(member)
            db.commit()
            return True
        return False

    def get_user_territories(self, db: Session, user_id: int) -> List[Territory]:
        """Get all territories a user belongs to"""
        return db.query(Territory).join(TerritoryMember).filter(
            TerritoryMember.user_id == user_id
        ).all()


class CRUDTerritoryRule:
    """CRUD operations for Territory Rules"""

    def get(self, db: Session, rule_id: int) -> Optional[TerritoryRule]:
        """Get rule by ID"""
        return db.query(TerritoryRule).filter(TerritoryRule.id == rule_id).first()

    def get_by_territory(
        self,
        db: Session,
        territory_id: int,
        is_active: Optional[bool] = True
    ) -> List[TerritoryRule]:
        """Get rules for a territory"""
        query = db.query(TerritoryRule).filter(TerritoryRule.territory_id == territory_id)

        if is_active is not None:
            query = query.filter(TerritoryRule.is_active == is_active)

        return query.order_by(TerritoryRule.priority.desc()).all()

    def create(
        self,
        db: Session,
        *,
        territory_id: int,
        obj_in: TerritoryRuleCreate
    ) -> TerritoryRule:
        """Create new territory rule"""
        rule = TerritoryRule(
            territory_id=territory_id,
            **obj_in.dict()
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule

    def update(
        self,
        db: Session,
        *,
        rule: TerritoryRule,
        obj_in: Dict[str, Any]
    ) -> TerritoryRule:
        """Update territory rule"""
        for field, value in obj_in.items():
            setattr(rule, field, value)

        rule.updated_at = datetime.utcnow()
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule

    def delete(self, db: Session, *, rule_id: int) -> bool:
        """Delete territory rule"""
        rule = self.get(db, rule_id)
        if rule:
            db.delete(rule)
            db.commit()
            return True
        return False

    def evaluate_rule(self, rule: TerritoryRule, entity: Dict[str, Any]) -> bool:
        """
        Evaluate if an entity matches a territory rule.

        Args:
            rule: The territory rule to evaluate
            entity: The entity data (lead, account, etc.) as a dict

        Returns:
            True if entity matches the rule conditions
        """
        conditions = rule.conditions

        if "and" in conditions:
            # AND condition - all must be true
            return all(
                self._evaluate_condition(cond, entity)
                for cond in conditions["and"]
            )
        elif "or" in conditions:
            # OR condition - at least one must be true
            return any(
                self._evaluate_condition(cond, entity)
                for cond in conditions["or"]
            )
        else:
            # Single condition
            return self._evaluate_condition(conditions, entity)

    def _evaluate_condition(self, condition: Dict[str, Any], entity: Dict[str, Any]) -> bool:
        """Evaluate a single condition"""
        field = condition.get("field")
        operator = condition.get("operator")
        expected_value = condition.get("value")

        # Get actual value from entity
        actual_value = entity.get(field)

        if actual_value is None:
            return False

        # Evaluate based on operator
        if operator == "equals":
            return actual_value == expected_value
        elif operator == "not_equals":
            return actual_value != expected_value
        elif operator == "contains":
            return expected_value in str(actual_value)
        elif operator == "greater_than":
            return float(actual_value) > float(expected_value)
        elif operator == "less_than":
            return float(actual_value) < float(expected_value)
        elif operator == "in":
            return actual_value in expected_value
        elif operator == "not_in":
            return actual_value not in expected_value
        elif operator == "starts_with":
            return str(actual_value).startswith(str(expected_value))
        elif operator == "ends_with":
            return str(actual_value).endswith(str(expected_value))

        return False


class CRUDTerritoryAssignment:
    """CRUD operations for Territory Assignments"""

    def get(self, db: Session, assignment_id: int) -> Optional[TerritoryAssignment]:
        """Get assignment by ID"""
        return db.query(TerritoryAssignment).filter(
            TerritoryAssignment.id == assignment_id
        ).first()

    def get_by_entity(
        self,
        db: Session,
        entity_type: str,
        entity_id: int
    ) -> List[TerritoryAssignment]:
        """Get all territory assignments for an entity"""
        return db.query(TerritoryAssignment).filter(
            and_(
                TerritoryAssignment.entity_type == entity_type,
                TerritoryAssignment.entity_id == entity_id
            )
        ).all()

    def get_by_territory(
        self,
        db: Session,
        territory_id: int,
        entity_type: Optional[str] = None
    ) -> List[TerritoryAssignment]:
        """Get all assignments for a territory"""
        query = db.query(TerritoryAssignment).filter(
            TerritoryAssignment.territory_id == territory_id
        )

        if entity_type:
            query = query.filter(TerritoryAssignment.entity_type == entity_type)

        return query.all()

    def create(
        self,
        db: Session,
        *,
        obj_in: TerritoryAssignmentCreate,
        assigned_by_user_id: Optional[int] = None,
        assigned_by_rule_id: Optional[int] = None
    ) -> TerritoryAssignment:
        """Create new territory assignment"""
        # If setting as primary, unset other primary assignments
        if obj_in.is_primary:
            db.query(TerritoryAssignment).filter(
                and_(
                    TerritoryAssignment.entity_type == obj_in.entity_type,
                    TerritoryAssignment.entity_id == obj_in.entity_id
                )
            ).update({"is_primary": False})

        assignment = TerritoryAssignment(
            **obj_in.dict(),
            assigned_by_user_id=assigned_by_user_id,
            assigned_by_rule_id=assigned_by_rule_id
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment

    def delete(self, db: Session, *, assignment_id: int) -> bool:
        """Delete territory assignment"""
        assignment = self.get(db, assignment_id)
        if assignment:
            db.delete(assignment)
            db.commit()
            return True
        return False

    def bulk_assign(
        self,
        db: Session,
        *,
        entity_type: str,
        entity_ids: List[int],
        territory_id: int,
        is_primary: bool = True,
        assigned_by_user_id: Optional[int] = None
    ) -> int:
        """Bulk assign entities to a territory"""
        count = 0
        for entity_id in entity_ids:
            try:
                obj_in = TerritoryAssignmentCreate(
                    territory_id=territory_id,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    is_primary=is_primary
                )
                self.create(db, obj_in=obj_in, assigned_by_user_id=assigned_by_user_id)
                count += 1
            except Exception:
                continue
        return count


class CRUDTerritoryQuota:
    """CRUD operations for Territory Quotas"""

    def get(self, db: Session, quota_id: int) -> Optional[TerritoryQuota]:
        """Get quota by ID"""
        return db.query(TerritoryQuota).filter(TerritoryQuota.id == quota_id).first()

    def get_by_territory(
        self,
        db: Session,
        territory_id: int,
        year: Optional[int] = None,
        quarter: Optional[int] = None
    ) -> List[TerritoryQuota]:
        """Get quotas for a territory"""
        query = db.query(TerritoryQuota).filter(
            TerritoryQuota.territory_id == territory_id
        )

        if year:
            query = query.filter(TerritoryQuota.year == year)
        if quarter:
            query = query.filter(TerritoryQuota.quarter == quarter)

        return query.all()

    def create(
        self,
        db: Session,
        *,
        territory_id: int,
        obj_in: TerritoryQuotaCreate
    ) -> TerritoryQuota:
        """Create new territory quota"""
        quota = TerritoryQuota(
            territory_id=territory_id,
            **obj_in.dict()
        )
        db.add(quota)
        db.commit()
        db.refresh(quota)
        return quota

    def update(
        self,
        db: Session,
        *,
        quota: TerritoryQuota,
        obj_in: Dict[str, Any]
    ) -> TerritoryQuota:
        """Update territory quota"""
        for field, value in obj_in.items():
            setattr(quota, field, value)

        quota.updated_at = datetime.utcnow()
        db.add(quota)
        db.commit()
        db.refresh(quota)
        return quota

    def delete(self, db: Session, *, quota_id: int) -> bool:
        """Delete territory quota"""
        quota = self.get(db, quota_id)
        if quota:
            db.delete(quota)
            db.commit()
            return True
        return False


# Create instances
crud_territory = CRUDTerritory()
crud_territory_rule = CRUDTerritoryRule()
crud_territory_assignment = CRUDTerritoryAssignment()
crud_territory_quota = CRUDTerritoryQuota()
