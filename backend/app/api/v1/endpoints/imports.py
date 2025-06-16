import csv
import logging
from io import StringIO
from typing import List
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import lead as crud_lead
from app.crud.user import user as crud_user
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadResponse
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

def normalize_column_name(column: str) -> str:
    """Normalize column names by removing special characters and converting to lowercase"""
    return column.lower().strip().replace(' ', '_').replace('-', '_')

def validate_csv_headers(headers: List[str]) -> List[str]:
    """Validate CSV headers and return normalized headers"""
    required_fields = {
        'first_name',
        'last_name',
        'company',
        'job_title',
        'location',  # or country
        'linkedin_url'  # or website
    }
    
    normalized_headers = [normalize_column_name(header) for header in headers]
    
    # Check for required fields
    missing_fields = required_fields - set(normalized_headers)
    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {', '.join(missing_fields)}"
        )
    
    return normalized_headers

@router.post("/leads/import/csv", response_model=LeadResponse)
async def import_leads_from_csv(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    file: UploadFile = File(...),
    user_id: int = Form(...),
) -> JSONResponse:
    """
    Import leads from CSV file and assign them to a specific user.
    Required fields: first_name, last_name, company, job_title, location/country, linkedin_url/website
    """
    if not current_user.is_admin and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to import leads"
        )

    # Check file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed"
        )

    # Get target user
    target_user = crud_user.get(db=db, id=user_id)
    if not target_user:
        raise HTTPException(
            status_code=404,
            detail=f"User with ID {user_id} not found"
        )

    # If not superuser, can only import for users in same organization
    if not current_user.is_superuser and target_user.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to import leads for users in other organizations"
        )

    try:
        # Read CSV file content
        content = await file.read()
        csv_text = content.decode('utf-8-sig')  # Handle BOM if present
        
        # Use pandas to read CSV and force all columns as string
        df = pd.read_csv(
            StringIO(csv_text), 
            dtype=str,  # Force all columns to be string type
            keep_default_na=False  # Prevent pandas from converting empty strings to NaN
        )
        
        # Validate headers
        headers = validate_csv_headers(df.columns.tolist())
        
        # Normalize column names
        df.columns = headers
        
        # Replace NaN with empty string
        df = df.fillna('')
        
        # Convert DataFrame to list of dictionaries
        leads_data = df.to_dict('records')
        
        # Process each lead
        imported_leads = []
        successful_imports = 0
        failed_imports = 0
        failed_details = []
        
        field_mapping = {
            'first_name': ['first_name', 'firstname', 'first'],
            'last_name': ['last_name', 'lastname', 'last'],
            'job_title': ['job_title', 'jobtitle', 'title', 'position'],
            'company': ['company', 'organization', 'employer'],
            'email': ['email', 'email_address', 'emailaddress'],
            'telephone': ['telephone', 'phone', 'tel', 'telephone_number'],
            'mobile': ['mobile', 'cell', 'mobile_number'],
            'location': ['location', 'city', 'address'],
            'linkedin': ['linkedin', 'linkedin_url', 'linkedinurl'],
            'country': ['country', 'nation'],
            'website': ['website', 'web', 'url'],
            'sector': ['sector', 'industry'],
            'time_in_current_role': ['time_in_current_role', 'time in current role', 'current_role_time'],
            'lab_comments': ['lab_comments', 'labcomments', 'lab_notes'],
            'client_comments': ['client_comments', 'clientcomments', 'client_notes'],
            'psychometrics': ['psychometrics', 'psychometric_score'],
            'wpi': ['wpi', 'wealth_potential_index'],
            'est_wealth_experience': ['est_wealth_experience', 'wealth_experience', 'experience']
        }

        # Process each row
        for index, row in df.iterrows():
            row_number = index + 1
            try:
                # Clean and normalize row data
                cleaned_row = {}
                for field, aliases in field_mapping.items():
                    for alias in aliases:
                        if alias in df.columns and row[alias]:
                            value = row[alias].strip()
                            if value:  # Only add non-empty values
                                cleaned_row[field] = value
                                break
                
                # Map CSV fields to lead data
                lead_data = {
                    "organization_id": target_user.organization_id,
                    "user_id": target_user.id,
                    "stage_id": 1,  # Default stage
                    "created_by": current_user.id,
                    **cleaned_row
                }
                
                # Create lead
                lead = crud_lead.create(db, obj_in=LeadCreate(**lead_data))
                imported_leads.append(lead)
                successful_imports += 1
                logger.info(f"Successfully imported lead from row {row_number}")
                
            except Exception as e:
                error_msg = f"Error in row {row_number}: {str(e)}"
                logger.error(error_msg)
                failed_imports += 1
                failed_details.append({"row": row_number, "error": str(e)})
                continue

        # Prepare response
        response_data = {
            "success": True,
            "message": "Import completed",
            "data": {
                "total_rows": len(df),
                "successful_imports": successful_imports,
                "failed_imports": failed_imports,
                "failed_details": failed_details
            }
        }

        return JSONResponse(
            content=response_data,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            }
        )

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file encoding. Please use UTF-8"
        )
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=400,
            detail="The CSV file is empty"
        )
    except Exception as e:
        logger.error(f"Error importing CSV: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error processing CSV file: {str(e)}"
        )

@router.get("/leads/template")
async def download_import_template(
    current_user: User = Depends(deps.get_current_user)
):
    """Download CSV template for lead import"""
    import io
    
    # Define the template headers
    headers = [
        'first_name', 'last_name', 'email', 'company', 'job_title',
        'location', 'country', 'linkedin', 'telephone', 'mobile',
        'website', 'sector', 'time_in_current_role', 'lab_comments', 
        'client_comments', 'est_wealth_experience'
    ]
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(headers)
    
    # Write sample data row
    writer.writerow([
        'John', 'Doe', 'john.doe@example.com', 'Example Corp', 'CEO',
        'New York', 'USA', 'https://linkedin.com/in/johndoe', '+1234567890', '+1234567890',
        'https://example.com', 'Technology', '2 years', 'Sample lab comments',
        'Sample client comments', 'High'
    ])
    
    # Prepare the response
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename=leads_import_template.csv'}
    )


