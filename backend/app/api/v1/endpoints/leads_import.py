from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import logging
from datetime import datetime
import traceback
import io

from app import crud, models, schemas
from app.schemas.response import GenericResponse
from app.api import deps
from app.schemas.lead_stage import LeadStageCreate
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()


def clean_value(value):
    """Clean value from NaN, empty strings, and whitespace."""
    if pd.isna(value) or value == "" or (isinstance(value, str) and value.strip() == ""):
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned if cleaned else None
    return value


def decode_csv_bytes(content: bytes) -> str:
    """Decode CSV content using common encodings with fallback."""
    for encoding in ("utf-8", "utf-8-sig", "cp1252", "latin-1", "utf-16"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise HTTPException(
        status_code=400,
        detail="Error reading CSV file: unsupported encoding. Please save as UTF-8."
    )


@router.post("/import/csv", response_model=GenericResponse)
async def import_leads_from_csv(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    assigned_user_id: int = Form(...),  # User ID to assign leads to
    tag_id: int = Form(None),  # Optional tag ID to assign to leads
    new_tag_name: str = Form(None),  # Optional new tag name to create and assign
    file: UploadFile = File(...),
):
    """
    Import leads from CSV file.
    The leads will be assigned to the specified user.
    Optionally, a tag can be assigned to all imported leads.
    """
    # Non-admins can only assign to themselves
    if not current_user.is_admin and assigned_user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only assign leads to yourself."
        )

    # Get the assigned user
    try:
        assigned_user = crud.user.get(db, id=assigned_user_id)
        if not assigned_user:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found"
            )
        if not assigned_user.organization_id:
            raise HTTPException(
                status_code=400,
                detail="Assigned user must be associated with an organization"
            )
    except Exception as e:
        logger.error(f"Error getting assigned user: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error with assigned user: {str(e)}"
        )

    # Get default stage_id for new leads
    try:
        default_stage = crud.lead_stage.get_by_order_index(
            db,
            order_index=1,
            organization_id=assigned_user.organization_id
        )
        if not default_stage:
            try:
                default_stage = crud.lead_stage.create(
                    db=db,
                    obj_in=LeadStageCreate(
                        name="New",
                        description="Default stage for new leads",
                        color="#808080",
                        order=1,
                        organization_id=assigned_user.organization_id,
                        is_active=True
                    )
                )
                logger.info(f"Created default stage: {default_stage.id}")
            except Exception as e:
                logger.error(f"Error creating default stage: {str(e)}")
                raise HTTPException(
                    status_code=400,
                    detail="Could not create default lead stage. Please create at least one lead stage first."
                )
    except Exception as e:
        logger.error(f"Error getting/creating default stage: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=400,
            detail=f"Error with lead stages: {str(e)}"
        )

    # Handle tag - either use existing tag or create new one
    tag = None
    if tag_id:
        tag = crud.tag.get(db, id=tag_id)
        if not tag:
            raise HTTPException(
                status_code=404,
                detail=f"Tag with ID {tag_id} not found"
            )
        logger.info(f"Leads will be tagged with existing tag '{tag.name}'")
    elif new_tag_name:
        try:
            existing_tag = crud.tag.check_duplicate(
                db=db,
                name=new_tag_name,
                organization_id=current_user.organization_id
            )

            if existing_tag:
                tag = existing_tag
                logger.info(f"Using existing tag '{new_tag_name}' with ID {tag.id}")
            else:
                tag_data = {
                    "name": new_tag_name,
                    "organization_id": current_user.organization_id,
                    "created_at": datetime.utcnow()
                }
                logger.info(f"Attempting to create new tag with data: {tag_data}")

                try:
                    new_tag = models.Tag(**tag_data)
                    db.add(new_tag)
                    db.commit()
                    db.refresh(new_tag)
                    tag = new_tag
                    logger.info(f"Successfully created new tag '{new_tag_name}' with ID {tag.id}")
                except Exception as create_error:
                    logger.error(f"Error in tag creation: {str(create_error)}")
                    logger.error(traceback.format_exc())
                    db.rollback()
                    raise create_error
        except Exception as e:
            logger.error(f"Error handling tag creation: {str(e)}")
            logger.error(traceback.format_exc())
            tag = None

    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed"
        )

    try:
        logger.info(f"Starting CSV import for file: {file.filename}")

        content = await file.read()
        if len(content) == 0:
            logger.error("Empty CSV file uploaded")
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty"
            )

        csv_text = decode_csv_bytes(content)
        df = pd.read_csv(io.StringIO(csv_text))

        if len(df) == 0:
            logger.error("CSV file has no data rows")
            raise HTTPException(
                status_code=400,
                detail="The CSV file contains no data rows"
            )

        logger.info(f"Successfully read CSV file with {len(df)} rows")

        df.columns = [col.strip().lower().replace(" ", "_").replace("-", "_") for col in df.columns]

        successful_imports = []
        failed_imports = []
        leads_to_create = []

        field_mappings = {
            "first_name": ["first_name", "firstname", "first"],
            "last_name": ["last_name", "lastname", "last"],
            "email": ["email", "email_address", "emails"],
            "job_title": ["job_title", "jobtitle", "title", "position"],
            "company": ["company", "organization"],
            "linkedin": ["linkedin", "linkedin_url", "linkedinurl"],
            "location": ["location", "city"],
            "country": ["country"],
            "website": ["website", "web", "url"],
            "telephone": ["telephone", "phone", "tel"],
            "mobile": ["mobile", "cell", "mobile_phone"],
            "sector": ["sector", "industry"],
            "time_in_current_role": ["time_in_current_role", "time_in_role", "role_duration"],
            "lab_comments": ["lab_comments", "lab_comment", "labcomments"],
            "client_comments": ["client_comments", "client_comment", "clientcomments"],
            "source": ["source", "lead_source"]
        }

        for index, row in df.iterrows():
            try:
                lead_data = {}
                for db_field, possible_names in field_mappings.items():
                    matching_col = next((col for col in possible_names if col in df.columns), None)
                    if matching_col:
                        value = row[matching_col]
                        if db_field in ["mobile", "telephone"]:
                            if isinstance(value, (int, float)) and not pd.isna(value):
                                value = str(int(value))
                            value = clean_value(value)
                        else:
                            value = clean_value(value)
                        lead_data[db_field] = value

                if "email" not in lead_data:
                    lead_data["email"] = None

                lead_data.update({
                    "psychometrics": None,
                    "wpi": float(clean_value(row.get("wpi", 0))) if clean_value(row.get("wpi", "")) else None,
                    "stage_id": default_stage.id,
                    "user_id": assigned_user_id,
                    "organization_id": assigned_user.organization_id,
                    "created_by": current_user.id,
                    "created_at": datetime.utcnow(),
                    "source": lead_data.get("source", "Partner")
                })

                if lead_data.get("email"):
                    existing_lead = crud.lead.get_by_email(db, email=lead_data["email"])
                    if existing_lead:
                        failed_imports.append({
                            "row": index + 2,
                            "error": f"Lead with email {lead_data['email']} already exists"
                        })
                        continue

                lead_create = schemas.LeadCreate(**lead_data)
                leads_to_create.append(lead_create)
                successful_imports.append(index + 2)

            except Exception as e:
                logger.error(f"Error processing row {index + 2}: {str(e)}")
                failed_imports.append({
                    "row": index + 2,
                    "error": str(e)
                })

        if leads_to_create:
            try:
                created_leads = crud.lead.create_bulk(db, obj_in_list=leads_to_create)
                logger.info(f"Successfully created {len(created_leads)} leads")

                if tag and created_leads:
                    try:
                        for lead in created_leads:
                            db.execute(
                                models.associations.lead_tags.insert().values(
                                    lead_id=lead.id,
                                    tag_id=tag.id,
                                    organization_id=lead.organization_id,
                                    created_at=datetime.utcnow()
                                )
                            )
                        db.commit()
                        logger.info(f"Successfully tagged {len(created_leads)} leads with tag '{tag.name}'")
                    except Exception as tag_error:
                        logger.error(f"Error tagging leads: {str(tag_error)}")
            except Exception as e:
                logger.error(f"Error during bulk creation: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error creating leads: {str(e)}"
                )

        total_rows = len(df)
        successful_count = len(successful_imports)
        failed_count = len(failed_imports)

        return GenericResponse(
            success=True,
            message="Import completed",
            data={
                "total_rows": total_rows,
                "successful_imports": successful_count,
                "failed_imports": failed_count,
                "failed_details": failed_imports
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during CSV import: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error importing leads: {str(e)}"
        )


from fastapi.responses import StreamingResponse
import csv


@router.get("/template", response_class=StreamingResponse)
async def download_csv_template(
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Download a CSV template with sample data for lead imports
    """
    try:
        output = io.StringIO()
        writer = csv.writer(output)

        headers = [
            "FIRSTNAME", "LASTNAME", "COMPANY", "JOB_TITLE", "LOCATION", "COUNTRY",
            "EMAILS", "TELEPHONE", "MOBILE", "LINKEDIN", "WEBSITE", "SECTOR",
            "NOTE"
        ]
        writer.writerow(headers)

        sample_data = [
            [
                "John", "Doe", "Tech Corp", "Senior Developer", "San Francisco", "USA",
                "john.doe@techcorp.com", "+1-555-0123", "+1-555-4567",
                "https://linkedin.com/in/johndoe", "https://techcorp.com",
                "Technology", "Experienced developer with cloud expertise"
            ],
            [
                "Jane", "Smith", "Finance Inc", "Investment Manager", "London", "UK",
                "jane.smith@financeinc.com", "+44-20-1234", "+44-77-5678",
                "https://linkedin.com/in/janesmith", "https://financeinc.com",
                "Finance", "Specializes in portfolio management"
            ]
        ]

        for row in sample_data:
            writer.writerow(row)

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=leads_template.csv"
            }
        )
    except Exception as e:
        logger.error(f"Error generating CSV template: {str(e)}")
        logger.exception("Template generation exception:")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating template: {str(e)}"
        )
