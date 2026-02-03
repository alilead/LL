from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import logging
from typing import List
from datetime import datetime
import traceback

from app import crud, models, schemas
from app.schemas.response import GenericResponse
from app.api import deps
from app.schemas.lead_stage import LeadStageCreate
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

def clean_value(value):
    """Clean value from NaN, empty strings, and whitespace"""
    if pd.isna(value) or value == "" or (isinstance(value, str) and value.strip() == ""):
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned if cleaned else None
    return value

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
    # Allow all authenticated users to import leads
    # No admin check needed
    
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
        # Get or create a default stage for this organization
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
        # Create a new tag with the provided name
        try:
            # First check if a tag with this name already exists in this organization
            existing_tag = crud.tag.check_duplicate(
                db=db,
                name=new_tag_name,
                organization_id=current_user.organization_id
            )
            
            if existing_tag:
                # If tag already exists, use it instead of creating a new one
                tag = existing_tag
                logger.info(f"Using existing tag '{new_tag_name}' with ID {tag.id}")
            else:
                # Create new tag - only include fields that are in the model
                tag_data = {
                    "name": new_tag_name,
                    "organization_id": current_user.organization_id,
                    "created_at": datetime.utcnow()
                }
                
                # Log the tag data being created
                logger.info(f"Attempting to create new tag with data: {tag_data}")
                
                try:
                    # Directly use the model to create the tag to bypass validation issues
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
            # Don't fail the whole import process if tag creation fails
            # Just log the error and continue without a tag
            tag = None

    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed"
        )

    try:
        logger.info(f"Starting CSV import for file: {file.filename}")
        
        # Read CSV file
        try:
            # Check if file is empty
            content = await file.read()
            if len(content) == 0:
                logger.error("Empty CSV file uploaded")
                raise HTTPException(
                    status_code=400,
                    detail="The uploaded file is empty"
                )
            
            # Reset file pointer to beginning
            await file.seek(0)
            
            # Try to read CSV with multiple encoding attempts
            df = None
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'utf-16']
            last_error = None
            
            for encoding in encodings:
                try:
                    await file.seek(0)  # Reset file pointer
                    df = pd.read_csv(file.file, encoding=encoding)
                    logger.info(f"Successfully read CSV file with encoding: {encoding}")
                    break
                except UnicodeDecodeError as e:
                    last_error = e
                    logger.warning(f"Failed to read CSV with encoding {encoding}: {str(e)}")
                    continue
                except Exception as e:
                    last_error = e
                    logger.warning(f"Error reading CSV with encoding {encoding}: {str(e)}")
                    continue
            
            if df is None:
                logger.error(f"Failed to read CSV file with any encoding. Last error: {last_error}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Error reading CSV file: Could not decode file with any supported encoding (utf-8, latin-1, cp1252, iso-8859-1, utf-16). Please ensure your CSV file is properly encoded."
                )
            
            if len(df) == 0:
                logger.error("CSV file has no data rows")
                raise HTTPException(
                    status_code=400,
                    detail="The CSV file contains no data rows"
                )
            logger.info(f"Successfully read CSV file with {len(df)} rows")

            # Clean column names: convert to lowercase and replace spaces/special chars with underscores
            df.columns = [col.strip().lower().replace(" ", "_").replace("-", "_") for col in df.columns]

            # Initialize lists for successful and failed imports
            successful_imports = []
            failed_imports = []
            leads_to_create = []

            # Define field mappings from CSV columns to database fields
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

            # Process each row in the DataFrame
            for index, row in df.iterrows():
                try:
                    # Map CSV columns to database fields
                    lead_data = {"email": None}  # Initialize email to None
                    for db_field, possible_names in field_mappings.items():
                        # Find the first matching column name in the CSV
                        matching_col = next((col for col in possible_names if col in df.columns), None)
                        if matching_col:
                            value = row[matching_col]
                            # Special handling for mobile and telephone fields
                            if db_field in ['mobile', 'telephone']:
                                if isinstance(value, (int, float)) and not pd.isna(value):
                                    value = str(int(value))  # Convert to int first to remove decimal
                                value = clean_value(value)
                            else:
                                value = clean_value(value)
                            lead_data[db_field] = value

                    # Add required and special fields
                    lead_data.update({
                        "psychometrics": None,  # Initialize as None since it's JSON field
                        "wpi": float(clean_value(row.get("wpi", 0))) if clean_value(row.get("wpi", "")) else None,
                        "stage_id": default_stage.id,
                        "user_id": assigned_user_id,
                        "organization_id": assigned_user.organization_id,
                        "created_by": current_user.id,
                        "created_at": datetime.utcnow(),
                        "source": lead_data.get("source", "Partner")  # Set default source for imported leads
                    })

                    # Normalize email - handle empty strings, NaN, etc.
                    email_value = lead_data.get("email")
                    if email_value and str(email_value).strip() and str(email_value).lower() != "nan":
                        email_value = str(email_value).strip()
                        lead_data["email"] = email_value

                        # Check for duplicate email only if email is provided
                        existing_lead = crud.lead.get_by_email(db, email=email_value)
                        if existing_lead:
                            failed_imports.append({
                                "row": index + 2,
                                "error": f"Lead with email {email_value} already exists"
                            })
                            continue
                    else:
                        lead_data["email"] = None

                    # Create LeadCreate instance
                    lead_create = schemas.LeadCreate(**lead_data)
                    leads_to_create.append(lead_create)
                    successful_imports.append(index + 2)

                except Exception as e:
                    error_details = traceback.format_exc()
                    logger.error(f"Error processing row {index + 2}: {str(e)}")
                    logger.error(f"Error details: {error_details}")
                    logger.error(f"Lead data keys: {list(lead_data.keys()) if 'lead_data' in locals() else 'N/A'}")
                    failed_imports.append({
                        "row": index + 2,
                        "error": str(e)
                    })

            # Bulk create all valid leads
            if leads_to_create:
                try:
                    created_leads = crud.lead.create_bulk(db, obj_in_list=leads_to_create)
                    logger.info(f"Successfully created {len(created_leads)} leads")

                    # Add tag to created leads if a tag is provided
                    if tag and created_leads:
                        try:
                            # Add tag to each created lead
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
                            # We don't want to fail the whole import if tagging fails
                            # Just log the error and continue
                except Exception as e:
                    logger.error(f"Error during bulk creation: {str(e)}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Error creating leads: {str(e)}"
                    )

            # Prepare response
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

        except pd.errors.EmptyDataError:
            logger.error("CSV file is empty or has no valid data")
            raise HTTPException(
                status_code=400,
                detail="The CSV file is empty or has no valid data"
            )
        except pd.errors.ParserError as e:
            logger.error(f"Error parsing CSV file: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Error parsing CSV file. Please ensure it's a valid CSV format: {str(e)}"
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error reading CSV file: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=400,
                detail=f"Error reading CSV file: {str(e)}"
            )
        
    except Exception as e:
        logger.error(f"Unexpected error during CSV import: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error importing leads: {str(e)}"
        )

from fastapi.responses import StreamingResponse
import io
import csv

@router.get("/template", response_class=StreamingResponse)
async def download_csv_template(
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Download a CSV template with sample data for lead imports
    """
    try:
        # Create a StringIO object to write CSV data
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        headers = [
            'FIRSTNAME', 'LASTNAME', 'COMPANY', 'JOB_TITLE', 'LOCATION', 'COUNTRY',
            'EMAILS', 'TELEPHONE', 'MOBILE', 'LINKEDIN', 'WEBSITE', 'SECTOR', 
            'NOTE'
        ]
        writer.writerow(headers)
        
        # Write sample data rows
        sample_data = [
            [
                'John', 'Doe', 'Tech Corp', 'Senior Developer', 'San Francisco', 'USA',
                'john.doe@techcorp.com', '+1-555-0123', '+1-555-4567', 
                'https://linkedin.com/in/johndoe', 'https://techcorp.com',
                'Technology', 'Experienced developer with cloud expertise'
            ],
            [
                'Jane', 'Smith', 'Finance Inc', 'Investment Manager', 'London', 'UK',
                'jane.smith@financeinc.com', '+44-20-1234', '+44-77-5678',
                'https://linkedin.com/in/janesmith', 'https://financeinc.com',
                'Finance', 'Specializes in portfolio management'
            ]
        ]
        
        for row in sample_data:
            writer.writerow(row)
        
        # Create the response
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                'Content-Disposition': 'attachment; filename=leads_template.csv'
            }
        )
    except Exception as e:
        logger.error(f"Error generating CSV template: {str(e)}")
        logger.exception("Template generation exception:")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating template: {str(e)}"
        )
