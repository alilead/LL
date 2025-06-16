import csv
from io import StringIO
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.lead import Lead
from app.core.exceptions import InvalidCSVFormatError
from app.core.logger import logger

class CSVImporter:
    REQUIRED_HEADERS = [
        'FIRSTNAME', 'LASTNAME', 'COMPANY', 'JOB_TITLE', 'LOCATION', 'COUNTRY',
        'EMAILS', 'TELEPHONE', 'MOBILE', 'LINKEDIN', 'WEBSITE', 'SECTOR', 
        'UNIQUE_LEAD_ID', 'NOTE'
    ]
    
    REQUIRED_OR_FIELDS = [
        ('LINKEDIN', 'WEBSITE')  # At least one of these must be present
    ]

    def __init__(self, db: Session):
        self.db = db

    def validate_headers(self, headers: List[str]) -> bool:
        """Validate that all required headers are present in the CSV."""
        normalized_headers = [h.upper().strip() for h in headers]
        
        # Check all required headers except OR fields
        basic_headers = [h for h in self.REQUIRED_HEADERS if not any(h in pair for pair in self.REQUIRED_OR_FIELDS)]
        if not all(header in normalized_headers for header in basic_headers):
            return False
            
        # Check OR field pairs - at least one must be present
        for field_pair in self.REQUIRED_OR_FIELDS:
            if not any(field in normalized_headers for field in field_pair):
                return False
                
        return True

    def parse_csv_line(self, row: Dict[str, str]) -> Dict[str, Any]:
        """Parse a single CSV line into a lead data dictionary."""
        # Validate required fields
        required_fields = ['FIRSTNAME', 'LASTNAME', 'COMPANY', 'JOB_TITLE', 'LOCATION', 'COUNTRY']
        for field in required_fields:
            if not row.get(field, '').strip():
                raise ValueError(f"Required field '{field}' is empty")
                
        # Validate that either LinkedIn or Website is present
        if not (row.get('LINKEDIN', '').strip() or row.get('WEBSITE', '').strip()):
            raise ValueError("Either 'LINKEDIN' or 'WEBSITE' must be provided")
        
        return {
            'firstname': row['FIRSTNAME'].strip(),
            'lastname': row['LASTNAME'].strip(),
            'company': row['COMPANY'].strip(),
            'job_title': row['JOB_TITLE'].strip(),
            'email': row['EMAILS'].strip() if row['EMAILS'] else None,
            'mobile': row['MOBILE'].strip() if row['MOBILE'] else None,
            'telephone': row['TELEPHONE'].strip() if row['TELEPHONE'] else None,
            'location': row['LOCATION'].strip(),
            'country': row['COUNTRY'].strip(),
            'linkedin_url': row['LINKEDIN'].strip() if row['LINKEDIN'] else None,
            'website': row['WEBSITE'].strip() if row['WEBSITE'] else None,
            'sector': row['SECTOR'].strip() if row['SECTOR'] else None,
            'unique_lead_id': row['UNIQUE_LEAD_ID'].strip(),  # NOT NULL field
            'note': row['NOTE'].strip() if row['NOTE'] else None,
            'is_verified': False,  # Default value for NOT NULL field
            'status': 'new',  # Default status
            'email_purchased': False,
            'mobile_purchased': False,
            'telephone_purchased': False,
            'linkedin_purchased': False,
            'unique_lead_id_purchased': False
        }

    def import_csv(self, file_content: str, user_id: int) -> Dict[str, Any]:
        """Import leads from CSV content."""
        try:
            csv_file = StringIO(file_content)
            reader = csv.DictReader(csv_file)
            
            if not self.validate_headers(reader.fieldnames):
                raise InvalidCSVFormatError(
                    f"Invalid CSV headers. Required headers: {', '.join(self.REQUIRED_HEADERS)}"
                )

            results = {
                'total': 0,
                'success': 0,
                'failed': 0,
                'errors': []
            }

            for row in reader:
                results['total'] += 1
                try:
                    lead_data = self.parse_csv_line(row)
                    lead_data['user_id'] = user_id
                    
                    # Create new lead
                    lead = Lead(**lead_data)
                    self.db.add(lead)
                    self.db.commit()
                    results['success'] += 1
                    
                except Exception as e:
                    results['failed'] += 1
                    results['errors'].append({
                        'row': results['total'],
                        'error': f"Error processing row: {str(e)}"
                    })
                    logger.error(f"Error importing lead: {str(e)}")
                    self.db.rollback()  # Rollback on error

            return results
            
        except Exception as e:
            logger.error(f"Error importing CSV: {str(e)}")
            raise InvalidCSVFormatError(f"Error importing CSV: {str(e)}")
