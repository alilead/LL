from typing import List, Optional, Dict, Any
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.custom_field import CustomFieldDefinition, CustomFieldValue
from app.schemas.custom_field import (
    CustomFieldDefinitionCreate,
    CustomFieldDefinitionUpdate,
    CustomFieldValueCreate,
    CustomFieldValueUpdate
)


class CustomFieldDefinitionCRUD:
    def get(self, db: Session, id: int) -> Optional[CustomFieldDefinition]:
        """Get field definition by ID"""
        return db.query(CustomFieldDefinition).filter(
            CustomFieldDefinition.id == id
        ).first()

    def get_by_key(
        self,
        db: Session,
        organization_id: int,
        entity_type: str,
        key: str
    ) -> Optional[CustomFieldDefinition]:
        """Get field definition by key"""
        return db.query(CustomFieldDefinition).filter(
            and_(
                CustomFieldDefinition.organization_id == organization_id,
                CustomFieldDefinition.entity_type == entity_type,
                CustomFieldDefinition.key == key
            )
        ).first()

    def get_multi(
        self,
        db: Session,
        organization_id: int,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get multiple field definitions with filtering and pagination"""
        query = db.query(CustomFieldDefinition).filter(
            CustomFieldDefinition.organization_id == organization_id
        )

        if filters:
            if filters.get("entity_type"):
                query = query.filter(
                    CustomFieldDefinition.entity_type == filters["entity_type"]
                )
            if filters.get("field_type"):
                query = query.filter(
                    CustomFieldDefinition.field_type == filters["field_type"]
                )
            if filters.get("is_visible") is not None:
                query = query.filter(
                    CustomFieldDefinition.is_visible == filters["is_visible"]
                )
            if filters.get("group_name"):
                query = query.filter(
                    CustomFieldDefinition.group_name == filters["group_name"]
                )

        total = query.count()
        fields = query.order_by(
            CustomFieldDefinition.order.asc(),
            CustomFieldDefinition.created_at.desc()
        ).offset(skip).limit(limit).all()

        return {
            "fields": fields,
            "total": total,
            "page": skip // limit + 1,
            "size": limit,
            "has_more": total > (skip + limit)
        }

    def create(
        self,
        db: Session,
        *,
        obj_in: CustomFieldDefinitionCreate
    ) -> CustomFieldDefinition:
        """Create new field definition"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = CustomFieldDefinition(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: CustomFieldDefinition,
        obj_in: CustomFieldDefinitionUpdate
    ) -> CustomFieldDefinition:
        """Update field definition"""
        obj_data = jsonable_encoder(db_obj)
        update_data = obj_in.dict(exclude_unset=True)
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(
        self,
        db: Session,
        *,
        id: int
    ) -> CustomFieldDefinition:
        """Delete field definition"""
        obj = db.query(CustomFieldDefinition).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def reorder(
        self,
        db: Session,
        organization_id: int,
        entity_type: str,
        field_orders: Dict[int, int]
    ) -> List[CustomFieldDefinition]:
        """Reorder fields"""
        fields = db.query(CustomFieldDefinition).filter(
            and_(
                CustomFieldDefinition.organization_id == organization_id,
                CustomFieldDefinition.entity_type == entity_type,
                CustomFieldDefinition.id.in_(field_orders.keys())
            )
        ).all()

        for field in fields:
            field.order = field_orders[field.id]
            db.add(field)

        db.commit()
        return fields


class CustomFieldValueCRUD:
    def get(self, db: Session, id: int) -> Optional[CustomFieldValue]:
        """Get field value by ID"""
        return db.query(CustomFieldValue).filter(CustomFieldValue.id == id).first()

    def get_for_entity(
        self,
        db: Session,
        organization_id: int,
        entity_type: str,
        entity_id: int
    ) -> List[CustomFieldValue]:
        """Get all field values for an entity"""
        return db.query(CustomFieldValue).filter(
            and_(
                CustomFieldValue.organization_id == organization_id,
                CustomFieldValue.entity_type == entity_type,
                CustomFieldValue.entity_id == entity_id
            )
        ).all()

    def get_by_field_definition(
        self,
        db: Session,
        field_definition_id: int,
        entity_id: int
    ) -> Optional[CustomFieldValue]:
        """Get field value by definition and entity"""
        return db.query(CustomFieldValue).filter(
            and_(
                CustomFieldValue.field_definition_id == field_definition_id,
                CustomFieldValue.entity_id == entity_id
            )
        ).first()

    def create(
        self,
        db: Session,
        *,
        obj_in: CustomFieldValueCreate
    ) -> CustomFieldValue:
        """Create new field value"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = CustomFieldValue(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: CustomFieldValue,
        obj_in: CustomFieldValueUpdate
    ) -> CustomFieldValue:
        """Update field value"""
        obj_data = jsonable_encoder(db_obj)
        update_data = obj_in.dict(exclude_unset=True)
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(
        self,
        db: Session,
        *,
        id: int
    ) -> CustomFieldValue:
        """Delete field value"""
        obj = db.query(CustomFieldValue).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def bulk_update(
        self,
        db: Session,
        organization_id: int,
        entity_type: str,
        entity_id: int,
        values: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Bulk update field values"""
        result = {}
        
        for key, value in values.items():
            # Get field definition
            field_def = crud.custom_field_definition.get_by_key(
                db, organization_id, entity_type, key
            )
            if not field_def:
                continue

            # Get or create field value
            field_value = self.get_by_field_definition(
                db, field_def.id, entity_id
            )
            
            if field_value:
                field_value = self.update(
                    db,
                    db_obj=field_value,
                    obj_in=CustomFieldValueUpdate(value=value)
                )
            else:
                field_value = self.create(
                    db,
                    obj_in=CustomFieldValueCreate(
                        organization_id=organization_id,
                        field_definition_id=field_def.id,
                        entity_type=entity_type,
                        entity_id=entity_id,
                        value=value
                    )
                )

            result[key] = field_value.formatted_value

        return result


custom_field_definition = CustomFieldDefinitionCRUD()
custom_field_value = CustomFieldValueCRUD()
