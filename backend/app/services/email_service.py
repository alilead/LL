# app/services/email_service.py
import imaplib
import smtplib
import email
import re
import socket
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging
import base64
from sqlalchemy import and_

from app.models.email_account import EmailAccount, EmailSyncStatus, EmailProviderType
from app.models.email_message import Email, EmailDirection, EmailStatus
from app.models.email_attachment import EmailAttachment
from app.core.security import decrypt_password, encrypt_password
from app.db.session import get_db

logger = logging.getLogger(__name__)

class EmailService:
    """Core service for email operations using IMAP/SMTP"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def add_email_account(
        self,
        email: str,
        password: str,
        display_name: str,
        provider_type: EmailProviderType,
        organization_id: int,
        user_id: int,
        custom_settings: Optional[Dict] = None
    ) -> EmailAccount:
        """Add a new email account with auto-detection of settings"""
        
        try:
            # Validate provider_type
            if isinstance(provider_type, str):
                provider_value = provider_type.lower()
            else:
                provider_value = provider_type.value.lower()
                
            # Check if provider_type is valid
            valid_providers = [e.value for e in EmailProviderType]
            if provider_value not in valid_providers:
                raise ValueError(f"Invalid provider type: {provider_value}. Must be one of: {valid_providers}")
            
            # Check if account already exists
            existing_account = self.db.query(EmailAccount).filter(
                and_(
                    EmailAccount.email == email,
                    EmailAccount.organization_id == organization_id
                )
            ).first()
            
            if existing_account:
                raise ValueError("Email account already exists for this organization")
            
            # Auto-detect IMAP/SMTP settings based on provider
            imap_settings, smtp_settings = self._get_provider_settings(
                email=email,
                provider_type=provider_value,
                custom_settings=custom_settings
            )
            
            # Test connection before saving
            if not self._test_connection(email, password, imap_settings, smtp_settings):
                raise ValueError("Failed to connect to email server. Please check credentials.")
            
            # Encrypt password
            password_encrypted = encrypt_password(password)
            
            # Create email account
            email_account = EmailAccount(
                email=email,
                display_name=display_name or email,
                provider_type=provider_value,
                password_encrypted=password_encrypted,
                organization_id=organization_id,
                user_id=user_id,
                **imap_settings,
                **smtp_settings,
                # Default sync settings
                sync_status=EmailSyncStatus.ACTIVE,
                sync_enabled=True,
                sync_frequency_minutes=15,
                sync_sent_items=True,
                sync_inbox=True,
                days_to_sync=30,
                auto_create_contacts=True,
                auto_create_tasks=True
            )
            
            # Save to database
            self.db.add(email_account)
            self.db.commit()
            self.db.refresh(email_account)
            
            return email_account
            
        except Exception as e:
            logger.error(f"Error creating email account: {str(e)}")
            raise ValueError(f"Failed to save email account: {str(e)}")
    
    def get_email_accounts(self, organization_id: int, user_id: Optional[int] = None) -> List[EmailAccount]:
        """Get email accounts for an organization, optionally filtered by user"""
        
        query = self.db.query(EmailAccount).filter(EmailAccount.organization_id == organization_id)
        
        if user_id:
            query = query.filter(EmailAccount.user_id == user_id)
        
        return query.all()
    
    def get_email_account_by_id(self, account_id: int, organization_id: int) -> Optional[EmailAccount]:
        """Get a specific email account by ID"""
        
        return self.db.query(EmailAccount).filter(
            and_(
                EmailAccount.id == account_id,
                EmailAccount.organization_id == organization_id
            )
        ).first()
    
    def update_email_account(
        self,
        account_id: int,
        organization_id: int,
        email: Optional[str] = None,
        password: Optional[str] = None,
        display_name: Optional[str] = None,
        provider_type: Optional[str] = None,
        custom_settings: Optional[Dict] = None,
        sync_settings: Optional[Dict] = None
    ) -> Optional[EmailAccount]:
        """Update an existing email account"""
        
        try:
            # Get existing account
            account = self.get_email_account_by_id(account_id, organization_id)
            if not account:
                raise ValueError("Email account not found")
            
            # Update basic info
            if email:
                account.email = email
            if display_name:
                account.display_name = display_name
            if provider_type:
                # Validate provider_type
                if isinstance(provider_type, str):
                    provider_value = provider_type.lower()
                else:
                    provider_value = provider_type.value.lower()
                    
                valid_providers = [e.value for e in EmailProviderType]
                if provider_value not in valid_providers:
                    raise ValueError(f"Invalid provider type: {provider_value}")
                account.provider_type = provider_value
            
            # Update password if provided
            if password:
                account.password_encrypted = encrypt_password(password)
            
            # Update connection settings if provided
            if custom_settings:
                current_email = email or account.email
                current_provider = provider_type or account.provider_type
                
                imap_settings, smtp_settings = self._get_provider_settings(
                    email=current_email,
                    provider_type=current_provider,
                    custom_settings=custom_settings
                )
                
                # Test connection with new settings
                test_password = password or decrypt_password(account.password_encrypted)
                if not self._test_connection(current_email, test_password, imap_settings, smtp_settings):
                    raise ValueError("Failed to connect to email server with new settings")
                
                # Update IMAP settings
                for key, value in imap_settings.items():
                    setattr(account, key, value)
                
                # Update SMTP settings
                for key, value in smtp_settings.items():
                    setattr(account, key, value)
            
            # Update sync settings if provided
            if sync_settings:
                for key, value in sync_settings.items():
                    if hasattr(account, key):
                        setattr(account, key, value)
            
            # Update modified timestamp
            account.updated_at = datetime.utcnow()
            
            # Save changes
            self.db.commit()
            self.db.refresh(account)
            
            return account
            
        except Exception as e:
            logger.error(f"Error updating email account: {str(e)}")
            self.db.rollback()
            raise ValueError(f"Failed to update email account: {str(e)}")
    
    def delete_email_account(self, account_id: int, organization_id: int) -> bool:
        """Delete an email account"""
        
        try:
            account = self.get_email_account_by_id(account_id, organization_id)
            if not account:
                raise ValueError("Email account not found")
            
            self.db.delete(account)
            self.db.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting email account: {str(e)}")
            self.db.rollback()
            raise ValueError(f"Failed to delete email account: {str(e)}")
    
    def _get_provider_settings(self, email: str, provider_type: str, custom_settings: Optional[Dict] = None) -> Tuple[Dict, Dict]:
        """Auto-detect IMAP/SMTP settings based on email provider"""
        
        domain = email.split('@')[1].lower()
        
        # Predefined settings for providers
        provider_configs = {
            'the-leadlab.com': {
                'imap': {'imap_host': 'mail.the-leadlab.com', 'imap_port': 993, 'imap_use_ssl': True},
                'smtp': {'smtp_host': 'mail.the-leadlab.com', 'smtp_port': 587, 'smtp_use_tls': True}
            },
            'gmail.com': {
                'imap': {'imap_host': 'imap.gmail.com', 'imap_port': 993, 'imap_use_ssl': True},
                'smtp': {'smtp_host': 'smtp.gmail.com', 'smtp_port': 587, 'smtp_use_tls': True}
            },
            'outlook.com': {
                'imap': {'imap_host': 'outlook.office365.com', 'imap_port': 993, 'imap_use_ssl': True},
                'smtp': {'smtp_host': 'smtp.office365.com', 'smtp_port': 587, 'smtp_use_tls': True}
            },
            'yahoo.com': {
                'imap': {'imap_host': 'imap.mail.yahoo.com', 'imap_port': 993, 'imap_use_ssl': True},
                'smtp': {'smtp_host': 'smtp.mail.yahoo.com', 'smtp_port': 587, 'smtp_use_tls': True}
            }
        }
        
        # If custom settings provided, use them
        if custom_settings:
            return custom_settings.get('imap', {}), custom_settings.get('smtp', {})
        
        # If domain has predefined config, use it
        if domain in provider_configs:
            config = provider_configs[domain]
            return config['imap'], config['smtp']
        
        # For unknown domains, try to auto-detect
        if domain == 'the-leadlab.com':
            return provider_configs['the-leadlab.com']['imap'], provider_configs['the-leadlab.com']['smtp']
        
        # Default settings for unknown providers
        return (
            {'imap_host': f'imap.{domain}', 'imap_port': 993, 'imap_use_ssl': True},
            {'smtp_host': f'smtp.{domain}', 'smtp_port': 465, 'smtp_use_tls': False}
        )
    
    def _test_connection(self, email: str, password: str, imap_settings: Dict, smtp_settings: Dict) -> bool:
        """Test IMAP and SMTP connections with timeout"""
        try:
            # Test IMAP with timeout
            logger.info(f"Testing IMAP connection to {imap_settings['imap_host']}:{imap_settings['imap_port']}")
            
            # Set socket timeout
            socket.setdefaulttimeout(30)  # 30 seconds timeout
            
            # Try SSL first for IMAP
            try:
                imap = imaplib.IMAP4_SSL(imap_settings['imap_host'], imap_settings['imap_port'])
            except:
                # If SSL fails, try non-SSL
                logger.info("IMAP SSL failed, trying non-SSL connection")
                imap = imaplib.IMAP4(imap_settings['imap_host'], imap_settings['imap_port'])
            
            imap.login(email, password)
            imap.logout()
            logger.info(f"IMAP connection successful for {email}")
            
            # Test SMTP with timeout
            logger.info(f"Testing SMTP connection to {smtp_settings['smtp_host']}:{smtp_settings['smtp_port']}")
            
            # Try SSL first for port 465
            if smtp_settings.get('smtp_port') == 465:
                try:
                    smtp = smtplib.SMTP_SSL(smtp_settings['smtp_host'], smtp_settings['smtp_port'], timeout=30)
                    logger.info("SMTP SSL connection successful")
                except:
                    # If SSL fails on 465, try regular SMTP with STARTTLS
                    logger.info("SMTP SSL failed on port 465, trying STARTTLS")
                    smtp = smtplib.SMTP(smtp_settings['smtp_host'], 587, timeout=30)
                    smtp.starttls()
            else:
                # For other ports, try regular SMTP with STARTTLS
                smtp = smtplib.SMTP(smtp_settings['smtp_host'], smtp_settings['smtp_port'], timeout=30)
                if smtp_settings.get('smtp_use_tls', True):
                    smtp.starttls()
            
            smtp.login(email, password)
            smtp.quit()
            logger.info(f"SMTP connection successful for {email}")
            
            return True
            
        except socket.timeout:
            logger.error(f"Connection timeout for {email} - server may be unreachable")
            return False
        except imaplib.IMAP4.error as e:
            logger.error(f"IMAP authentication failed for {email}: {str(e)}")
            return False
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed for {email}: {str(e)}")
            return False
        except smtplib.SMTPConnectError as e:
            logger.error(f"SMTP connection failed for {email}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Connection test failed for {email}: {str(e)}")
            return False
        finally:
            # Reset socket timeout
            socket.setdefaulttimeout(None)
    
    def sync_account_emails(self, account_id: int, days_back: int = 30) -> Dict:
        """Sync emails for an account"""
        try:
            # Get account
            account = self.db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
            if not account:
                raise ValueError("Email account not found")
            
            # Refresh to get current values
            self.db.refresh(account)
            
            # Update sync status
            self.db.query(EmailAccount).filter(EmailAccount.id == account_id).update({
                "sync_status": "syncing",
                "last_sync_at": datetime.utcnow()
            })
            self.db.commit()
            
            # Refresh again to get updated values
            self.db.refresh(account)
            
            # Connect to IMAP
            password = decrypt_password(account.password_encrypted)
            imap = imaplib.IMAP4_SSL(account.imap_host, account.imap_port)
            imap.login(account.email, password)
            
            total_synced = 0
            total_errors = 0
            
            # Sync INBOX
            if account.sync_inbox:
                inbox_synced, inbox_errors = self._sync_folder(imap, account, "INBOX", days_back)
                total_synced += inbox_synced
                total_errors += inbox_errors
            
            # Sync Sent Items - custom mail için sadece "Sent" klasörü kullan
            # Gmail değil custom provider olduğu için standard "Sent" klasörünü kullan
            try:
                sent_folder = "Sent"  # Custom provider için standard folder
                sent_synced, sent_errors = self._sync_folder(imap, account, sent_folder, days_back)
                total_synced += sent_synced
                total_errors += sent_errors
            except Exception as sent_error:
                logger.error(f"Error syncing Sent folder: {sent_error}")
                total_errors += 1
            
            # Update sync status in database using raw query  
            self.db.query(EmailAccount).filter(EmailAccount.id == account_id).update({
                "sync_status": "active",
                "sync_error_message": None if total_errors == 0 else f"Failed to sync {total_errors} emails",
                "last_sync_at": datetime.utcnow()
            })
            self.db.commit()

            imap.logout()
            
            return {
                "success": True,
                "synced": total_synced,
                "errors": total_errors
            }
            
        except Exception as e:
            logger.error(f"Error syncing emails: {str(e)}")
            
            # Update sync status to error using raw query
            self.db.query(EmailAccount).filter(EmailAccount.id == account_id).update({
                "sync_status": "error",
                "sync_error_message": str(e),
                "last_sync_at": datetime.utcnow()
            })
            self.db.commit()
            
            return {
                "success": False,
                "error": str(e)
            }
    
    def _sync_folder(self, imap: imaplib.IMAP4_SSL, account: EmailAccount, folder: str, days_back: int) -> Tuple[int, int]:
        """Sync emails from a specific folder"""
        try:
            # Try to select the folder
            imap.select(folder)
            
            # Search for recent emails
            since_date = (datetime.now() - timedelta(days=days_back)).strftime("%d-%b-%Y")
            typ, data = imap.search(None, f'SINCE {since_date}')
            
            if typ != 'OK':
                logger.error(f"Failed to search folder {folder}")
                return 0, 0
            
            email_ids = data[0].split()
            synced_count = 0
            error_count = 0
            
            # Process emails in batches to avoid memory issues
            batch_size = 50
            for i in range(0, len(email_ids), batch_size):
                batch = email_ids[i:i + batch_size]
                
                # First get message IDs for all emails in batch
                for email_id in batch:
                    try:
                        # Get Message-ID header
                        typ, msg_data = imap.fetch(email_id, '(BODY[HEADER.FIELDS (MESSAGE-ID)])')
                        if typ != 'OK':
                            error_count += 1
                            continue
                            
                        message_id = email.message_from_bytes(msg_data[0][1]).get('Message-ID')
                        if not message_id:
                            error_count += 1
                            continue
                            
                        # Check if email already exists
                        existing_email = self.db.query(Email).filter(
                            Email.message_id == message_id,
                            Email.email_account_id == account.id
                        ).first()
                        
                        # Skip if email already exists
                        if existing_email:
                            logger.debug(f"Skipping existing email with Message-ID: {message_id}")
                            continue
                            
                        # If email doesn't exist, fetch full message
                        if self._sync_single_email(imap, account, email_id, folder):
                            synced_count += 1
                        else:
                            error_count += 1
                            
                    except Exception as e:
                        logger.error(f"Error processing email {email_id}: {str(e)}")
                        error_count += 1
                        continue
            
            return synced_count, error_count
            
        except Exception as e:
            logger.error(f"Error syncing folder {folder}: {str(e)}")
            return 0, 0
    
    def _sync_single_email(self, imap: imaplib.IMAP4_SSL, account: EmailAccount, email_id: bytes, folder: str) -> bool:
        """Sync a single email"""
        try:
            # Fetch the full email
            typ, msg_data = imap.fetch(email_id, '(RFC822)')
            if typ != 'OK':
                logger.error(f"Failed to fetch email {email_id}")
                return False
            
            email_body = msg_data[0][1]
            email_message = email.message_from_bytes(email_body)
            
            # Parse email data
            parsed_data = self._parse_email(email_message, account, folder)
            if not parsed_data:
                return False
            
            # Create email record
            db_email = Email(
                email_account_id=account.id,
                organization_id=account.organization_id,
                message_id=parsed_data['message_id'],
                subject=parsed_data['subject'],
                from_email=parsed_data['from_email'],
                from_name=parsed_data['from_name'],
                to_emails=json.dumps(parsed_data['to_emails']) if parsed_data['to_emails'] else json.dumps([]),
                cc_emails=json.dumps(parsed_data.get('cc_emails', [])),
                bcc_emails=json.dumps(parsed_data.get('bcc_emails', [])),
                reply_to=parsed_data.get('reply_to'),
                body_text=parsed_data.get('body_text'),
                body_html=parsed_data.get('body_html'),
                sent_date=parsed_data['sent_date'],
                direction=EmailDirection.incoming if folder.upper() == 'INBOX' else EmailDirection.outgoing,
                status=EmailStatus.unread if folder.upper() == 'INBOX' else EmailStatus.read
            )
            
            self.db.add(db_email)
            self.db.commit()
            
            # Process attachments if any
            if parsed_data.get('has_attachments'):
                self._process_attachments(email_message, db_email)
            
            # Analyze content for smart features
            self._analyze_email_content(db_email)
            
            return True
            
        except Exception as e:
            logger.error(f"Error syncing single email: {str(e)}")
            self.db.rollback()
            return False
    
    def _decode_email_subject(self, subject: str) -> str:
        """Decode base64 encoded email subject"""
        try:
            # Check for base64 encoded parts
            if '=?utf-8?B?' in subject:
                # Extract and decode each base64 part
                parts = []
                current_pos = 0
                while True:
                    start = subject.find('=?utf-8?B?', current_pos)
                    if start == -1:
                        # Add remaining text
                        if current_pos < len(subject):
                            parts.append(subject[current_pos:])
                        break
                    
                    # Add text before encoded part
                    if start > current_pos:
                        parts.append(subject[current_pos:start])
                    
                    # Find end of encoded part
                    end = subject.find('?=', start)
                    if end == -1:
                        # No end marker found, treat rest as plain text
                        parts.append(subject[current_pos:])
                        break
                    
                    # Extract base64 part
                    encoded = subject[start + 10:end]  # Skip =?utf-8?B?
                    try:
                        # Decode base64 to bytes then to UTF-8
                        decoded = base64.b64decode(encoded).decode('utf-8')
                        parts.append(decoded)
                    except:
                        # If decoding fails, keep original text
                        parts.append(subject[start:end + 2])
                    
                    current_pos = end + 2
                
                return ''.join(parts)
        except Exception as e:
            logger.error(f"Error decoding email subject: {str(e)}")
        
        return subject
    
    def _parse_email(self, msg: email.message.Message, account: EmailAccount, folder: str) -> Optional[Dict]:
        """Parse email message and extract relevant data"""
        try:
            # Get message ID
            message_id = msg.get('Message-ID', '').strip('<>')
            if not message_id:
                return None
            
            # Get subject and decode if needed
            subject = msg.get('Subject', '')
            if isinstance(subject, email.header.Header):
                subject = str(subject)
            subject = self._decode_email_subject(subject)
            
            # Get sender info
            from_header = msg.get('From', '')
            from_email = self._extract_email_from_header(from_header)
            from_name = self._extract_name_from_email(from_header)
            
            if not from_email:
                return None
            
            # Get recipient info
            to_header = msg.get('To', '')
            to_emails = self._parse_email_list(to_header)
            
            cc_header = msg.get('Cc', '')
            cc_emails = self._parse_email_list(cc_header) if cc_header else []
            
            bcc_header = msg.get('Bcc', '')
            bcc_emails = self._parse_email_list(bcc_header) if bcc_header else []
            
            # Get reply-to
            reply_to = msg.get('Reply-To', '')
            if reply_to:
                reply_to = self._extract_email_from_header(reply_to)
            
            # Get sent date
            date_str = msg.get('Date', '')
            try:
                sent_date = email.utils.parsedate_to_datetime(date_str)
            except:
                sent_date = datetime.utcnow()
            
            # Get email body
            body_text, body_html = self._extract_email_body(msg)
            
            # Check for attachments
            has_attachments = False
            for part in msg.walk():
                if part.get_content_maintype() == 'multipart':
                    continue
                if part.get('Content-Disposition') is None:
                    continue
                has_attachments = True
                break
            
            return {
                'message_id': message_id,
                'subject': subject or '(No Subject)',
                'from_email': from_email,
                'from_name': from_name,
                'to_emails': to_emails,
                'cc_emails': cc_emails,
                'bcc_emails': bcc_emails,
                'reply_to': reply_to,
                'body_text': body_text,
                'body_html': body_html,
                'sent_date': sent_date,
                'has_attachments': has_attachments
            }
            
        except Exception as e:
            logger.error(f"Error parsing email: {str(e)}")
            return None
    
    def _extract_email_body(self, msg: email.message.Message) -> Tuple[Optional[str], Optional[str]]:
        """Extract text and HTML body from email"""
        body_text = None
        body_html = None
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                
                if "attachment" not in content_disposition:
                    if content_type == "text/plain":
                        body_text = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    elif content_type == "text/html":
                        body_html = part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            content_type = msg.get_content_type()
            if content_type == "text/plain":
                body_text = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
            elif content_type == "text/html":
                body_html = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        
        return body_text, body_html
    
    def _parse_email_list(self, email_header: str) -> List[str]:
        """Parse comma-separated email list"""
        if not email_header:
            return []
        
        emails = []
        for addr in email_header.split(','):
            email_addr = self._extract_email_from_header(addr.strip())
            if email_addr:
                emails.append(email_addr)
        
        return emails
    
    def _extract_email_from_header(self, header: str) -> Optional[str]:
        """Extract email address from email header"""
        if not header:
            return None
        
        # Use regex to find email pattern
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        match = re.search(email_pattern, header)
        return match.group(0) if match else None
    
    def _extract_name_from_email(self, header: str) -> Optional[str]:
        """Extract display name from email header"""
        if not header:
            return None
        
        # Extract name before email
        if '<' in header:
            name = header.split('<')[0].strip().strip('"')
            return name if name else None
        
        return None
    
    def _process_attachments(self, msg: email.message.Message, db_email: Email):
        """Process and save email attachments"""
        for part in msg.walk():
            content_disposition = str(part.get("Content-Disposition"))
            
            if "attachment" in content_disposition:
                filename = part.get_filename()
                if filename:
                    content_type = part.get_content_type()
                    content = part.get_payload(decode=True)
                    
                    attachment = EmailAttachment(
                        filename=filename,
                        content_type=content_type,
                        size_bytes=len(content) if content else 0,
                        content=content if len(content) < 1024*1024 else None,  # Store only if < 1MB
                        is_inline=False,
                        is_calendar_invite=filename.lower().endswith('.ics'),
                        email_id=db_email.id
                    )
                    
                    self.db.add(attachment)
        
        self.db.commit()
    
    def _analyze_email_content(self, db_email: Email):
        """Analyze email content for meetings, tasks, etc."""
        content = (db_email.body_text or '') + ' ' + (db_email.body_html or '')
        
        # Prepare update data
        update_data = {}
        
        # Check for meeting-related keywords
        meeting_keywords = ['meeting', 'call', 'appointment', 'schedule', 'toplantı', 'randevu', 'görüşme']
        contains_meeting = any(keyword in content.lower() for keyword in meeting_keywords)
        
        if contains_meeting:
            update_data['contains_meeting_info'] = True
            
            # Extract dates (basic regex patterns)
            date_patterns = [
                r'\d{1,2}/\d{1,2}/\d{4}',  # MM/DD/YYYY
                r'\d{1,2}-\d{1,2}-\d{4}',  # MM-DD-YYYY
                r'\d{4}-\d{1,2}-\d{1,2}',  # YYYY-MM-DD
            ]
            
            extracted_dates = []
            for pattern in date_patterns:
                matches = re.findall(pattern, content)
                extracted_dates.extend(matches)
            
            if extracted_dates:
                update_data['extracted_dates'] = json.dumps(extracted_dates)
        
        # Extract action items (basic implementation)
        action_keywords = ['todo', 'action', 'follow up', 'call', 'email', 'send', 'review']
        action_items = []
        
        sentences = content.split('.')
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in action_keywords):
                action_items.append(sentence.strip())
        
        if action_items:
            update_data['action_items'] = json.dumps(action_items[:5])  # Limit to 5 action items
        
        # Update using raw query if there's data to update
        if update_data:
            self.db.query(Email).filter(Email.id == db_email.id).update(update_data)
            self.db.commit()
    
    def send_email(
        self,
        account_id: int,
        to_emails: List[str],
        subject: str,
        body_text: Optional[str] = None,
        body_html: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        reply_to: Optional[str] = None
    ) -> bool:
        """Send email using SMTP"""
        account = self.db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
        if not account:
            raise ValueError("Email account not found")
        
        try:
            password = decrypt_password(account.password_encrypted)
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{account.display_name} <{account.email}>" if account.display_name else account.email
            msg['To'] = ', '.join(to_emails)
            
            if cc_emails:
                msg['Cc'] = ', '.join(cc_emails)
            if reply_to:
                msg['Reply-To'] = reply_to
            
            # Add text and HTML parts
            if body_text:
                text_part = MIMEText(body_text, 'plain')
                msg.attach(text_part)
            
            if body_html:
                html_part = MIMEText(body_html, 'html')
                msg.attach(html_part)
            
            # Connect to SMTP and send
            smtp = None
            try:
                # Set timeout
                socket.setdefaulttimeout(30)  # 30 seconds timeout
                
                # Try SSL first for port 465
                if account.smtp_port == 465:
                    try:
                        smtp = smtplib.SMTP_SSL(account.smtp_host, account.smtp_port, timeout=30)
                        logger.info("SMTP SSL connection successful")
                    except:
                        # If SSL fails on 465, try regular SMTP with STARTTLS
                        logger.info("SMTP SSL failed on port 465, trying STARTTLS")
                        smtp = smtplib.SMTP(account.smtp_host, 587, timeout=30)
                        smtp.starttls()
                else:
                    # For other ports, try regular SMTP with STARTTLS
                    smtp = smtplib.SMTP(account.smtp_host, account.smtp_port, timeout=30)
                    if account.smtp_use_tls:
                        smtp.starttls()
                
                smtp.login(account.email, password)
                
                all_recipients = to_emails + (cc_emails or []) + (bcc_emails or [])
                smtp.send_message(msg, to_addrs=all_recipients)
                
            finally:
                if smtp:
                    try:
                        smtp.quit()
                    except:
                        pass
                socket.setdefaulttimeout(None)
            
            # Save sent email to database
            sent_email = Email(
                message_id=msg['Message-ID'] or f"sent-{datetime.utcnow().timestamp()}",
                subject=subject,
                from_email=account.email,
                from_name=account.display_name,
                to_emails=json.dumps(to_emails) if to_emails else json.dumps([]),
                cc_emails=json.dumps(cc_emails) if cc_emails else json.dumps([]),
                bcc_emails=json.dumps(bcc_emails) if bcc_emails else json.dumps([]),
                body_text=body_text,
                body_html=body_html,
                direction=EmailDirection.outgoing,
                status=EmailStatus.read,
                sent_date=datetime.utcnow(),
                received_date=datetime.utcnow(),
                folder_name='SENT',
                email_account_id=account.id,
                organization_id=account.organization_id
            )
            
            self.db.add(sent_email)
            self.db.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False 