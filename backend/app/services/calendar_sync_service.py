from typing import List, Optional, Dict, Any
import logging
import requests
from datetime import datetime, timedelta
try:
    from icalendar import Calendar, Event
    ICALENDAR_AVAILABLE = True
except ImportError:
    # icalendar not available, CalDAV sync will be limited
    ICALENDAR_AVAILABLE = False
from sqlalchemy.orm import Session
from app.models.email_account import EmailAccount, EmailProviderType
from app.models.event import Event as EventModel
from app.crud.crud_event import event
import pytz

logger = logging.getLogger(__name__)

class CalendarSyncService:
    """Service for syncing calendar events from email providers"""
    
    def __init__(self, db: Session):
        self.db = db
        
    async def sync_account_calendar(self, email_account: EmailAccount) -> Dict[str, Any]:
        """Sync calendar events for a specific email account"""
        try:
            if not email_account.calendar_sync_enabled:
                return {"status": "disabled", "message": "Calendar sync is disabled"}
            
            logger.info(f"Starting calendar sync for {email_account.email}")
            
            events_synced = 0
            events_created = 0
            events_updated = 0
            
            if email_account.provider_type == EmailProviderType.GMAIL:
                result = await self._sync_google_calendar(email_account)
            elif email_account.provider_type == EmailProviderType.OUTLOOK:
                result = await self._sync_outlook_calendar(email_account)
            elif email_account.provider_type == EmailProviderType.YAHOO:
                result = await self._sync_yahoo_calendar(email_account)
            else:
                result = await self._sync_caldav_calendar(email_account)
            
            # Update last sync time
            email_account.last_calendar_sync_at = datetime.utcnow()
            email_account.calendar_sync_error = None
            self.db.commit()
            
            return result
            
        except Exception as e:
            logger.error(f"Calendar sync failed for {email_account.email}: {str(e)}")
            email_account.calendar_sync_error = str(e)
            self.db.commit()
            return {"status": "error", "message": str(e)}
    
    async def _sync_google_calendar(self, email_account: EmailAccount) -> Dict[str, Any]:
        """Sync Google Calendar events using Google Calendar API"""
        try:
            if not email_account.calendar_sync_token:
                return {"status": "error", "message": "No OAuth token available"}
            
            # Google Calendar API endpoint
            calendar_id = 'primary'
            url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events"
            
            headers = {
                'Authorization': f'Bearer {email_account.calendar_sync_token}',
                'Content-Type': 'application/json'
            }
            
            # Get events from last 30 days to future 90 days
            time_min = (datetime.utcnow() - timedelta(days=30)).isoformat() + 'Z'
            time_max = (datetime.utcnow() + timedelta(days=90)).isoformat() + 'Z'
            
            params = {
                'timeMin': time_min,
                'timeMax': time_max,
                'singleEvents': True,
                'orderBy': 'startTime',
                'maxResults': 250
            }
            
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 401:
                return {"status": "auth_error", "message": "OAuth token expired"}
            
            response.raise_for_status()
            data = response.json()
            
            events_created = 0
            events_updated = 0
            
            for item in data.get('items', []):
                event_data = self._convert_google_event(item, email_account)
                if event_data:
                    result = await self._create_or_update_event(event_data, email_account)
                    if result == 'created':
                        events_created += 1
                    elif result == 'updated':
                        events_updated += 1
            
            return {
                "status": "success",
                "events_created": events_created,
                "events_updated": events_updated,
                "total_events": len(data.get('items', []))
            }
            
        except Exception as e:
            logger.error(f"Google Calendar sync error: {str(e)}")
            raise
    
    async def _sync_outlook_calendar(self, email_account: EmailAccount) -> Dict[str, Any]:
        """Sync Outlook Calendar events using Microsoft Graph API"""
        try:
            if not email_account.calendar_sync_token:
                return {"status": "error", "message": "No OAuth token available"}
            
            # Microsoft Graph API endpoint
            url = "https://graph.microsoft.com/v1.0/me/events"
            
            headers = {
                'Authorization': f'Bearer {email_account.calendar_sync_token}',
                'Content-Type': 'application/json'
            }
            
            # Get events from last 30 days to future 90 days
            start_time = (datetime.utcnow() - timedelta(days=30)).isoformat() + 'Z'
            end_time = (datetime.utcnow() + timedelta(days=90)).isoformat() + 'Z'
            
            params = {
                '$filter': f"start/dateTime ge '{start_time}' and start/dateTime le '{end_time}'",
                '$orderby': 'start/dateTime',
                '$top': 250
            }
            
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 401:
                return {"status": "auth_error", "message": "OAuth token expired"}
            
            response.raise_for_status()
            data = response.json()
            
            events_created = 0
            events_updated = 0
            
            for item in data.get('value', []):
                event_data = self._convert_outlook_event(item, email_account)
                if event_data:
                    result = await self._create_or_update_event(event_data, email_account)
                    if result == 'created':
                        events_created += 1
                    elif result == 'updated':
                        events_updated += 1
            
            return {
                "status": "success",
                "events_created": events_created,
                "events_updated": events_updated,
                "total_events": len(data.get('value', []))
            }
            
        except Exception as e:
            logger.error(f"Outlook Calendar sync error: {str(e)}")
            raise
    
    async def _sync_yahoo_calendar(self, email_account: EmailAccount) -> Dict[str, Any]:
        """Sync Yahoo Calendar - Yahoo uses CalDAV"""
        # Yahoo CalDAV URL
        email_account.calendar_url = f"https://caldav.calendar.yahoo.com/dav/{email_account.email}/Calendar/Calendar"
        return await self._sync_caldav_calendar(email_account)
    
    async def _sync_caldav_calendar(self, email_account: EmailAccount) -> Dict[str, Any]:
        """Sync calendar using CalDAV protocol"""
        try:
            if not email_account.calendar_url:
                return {"status": "error", "message": "No CalDAV URL configured"}
            
            # Basic CalDAV implementation using requests
            # Common CalDAV calendar discovery paths:
            calendar_paths = [
                email_account.calendar_url,
                email_account.calendar_url.rstrip('/') + '/calendar/',
                email_account.calendar_url.rstrip('/') + '/calendars/',
                email_account.calendar_url.rstrip('/') + f'/calendars/{email_account.email}/',
                email_account.calendar_url.rstrip('/') + '/cal.php/calendars/user/',
            ]
            
            # Add Kolab/Plesk specific paths if detected
            base_domain = email_account.calendar_url.split('/')[2] if '://' in email_account.calendar_url else ''
            if 'kolab' in email_account.calendar_url.lower() or 'irony' in email_account.calendar_url.lower() or 'the-leadlab.com' in base_domain:
                # Kolab iRony CalDAV paths
                kolab_paths = [
                    f"https://{base_domain}/iRony/calendars/{email_account.email}/",
                    f"https://{base_domain}/iRony/calendars/{email_account.email}/Calendar/",
                    f"https://{base_domain}/iRony/principals/{email_account.email}/",
                    f"https://{base_domain}/iRony/",
                    f"https://{base_domain}/kolab-webadmin/api/calendars/{email_account.email}/",
                    f"https://{base_domain}/caldav/calendars/{email_account.email}/",
                    f"https://{base_domain}/caldav/{email_account.email}/",
                ]
                calendar_paths.extend(kolab_paths)
            
            events_created = 0
            events_updated = 0
            
            for calendar_url in calendar_paths:
                try:
                    # Try to discover calendar collections
                    response = requests.request(
                        'PROPFIND',
                        calendar_url,
                        headers={
                            'Depth': '1',
                            'Content-Type': 'application/xml; charset=utf-8'
                        },
                        auth=(email_account.email, email_account.password if hasattr(email_account, 'password') else ''),
                        data='''<?xml version="1.0" encoding="utf-8" ?>
                        <propfind xmlns="DAV:">
                            <prop>
                                <resourcetype />
                                <displayname />
                            </prop>
                        </propfind>''',
                        timeout=10
                    )
                    
                    if response.status_code == 207:  # Multi-Status success
                        logger.info(f"Successfully connected to CalDAV at: {calendar_url}")
                        
                        # For now, return success with basic info
                        # Full implementation would parse WebDAV XML response and fetch events
                        return {
                            "status": "success", 
                            "message": f"CalDAV connection successful to {calendar_url}",
                            "events_created": events_created,
                            "events_updated": events_updated,
                            "calendar_url": calendar_url
                        }
                        
                except requests.exceptions.RequestException as e:
                    logger.debug(f"Failed to connect to {calendar_url}: {str(e)}")
                    continue
            
            return {
                "status": "error",
                "message": "Could not connect to any CalDAV calendar endpoints. Please check your calendar URL and credentials.",
                "tried_urls": calendar_paths
            }
            
        except Exception as e:
            logger.error(f"CalDAV sync error: {str(e)}")
            return {
                "status": "error",
                "message": f"CalDAV sync failed: {str(e)}"
            }
    
    def _convert_google_event(self, google_event: Dict[str, Any], email_account: EmailAccount) -> Optional[Dict[str, Any]]:
        """Convert Google Calendar event to our event format"""
        try:
            # Skip cancelled events
            if google_event.get('status') == 'cancelled':
                return None
            
            start = google_event.get('start', {})
            end = google_event.get('end', {})
            
            # Handle all-day events
            if 'date' in start:
                start_date = datetime.strptime(start['date'], '%Y-%m-%d')
                end_date = datetime.strptime(end['date'], '%Y-%m-%d')
                is_all_day = True
            else:
                start_date = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00'))
                is_all_day = False
            
            # Get creation and update times
            created_at = datetime.fromisoformat(google_event.get('created', datetime.utcnow().isoformat()).replace('Z', '+00:00'))
            updated_at = datetime.fromisoformat(google_event.get('updated', datetime.utcnow().isoformat()).replace('Z', '+00:00'))
            
            return {
                'external_id': google_event['id'],
                'title': google_event.get('summary', 'No Title'),
                'description': google_event.get('description', ''),
                'start_date': start_date,
                'end_date': end_date,
                'location': google_event.get('location', ''),
                'is_all_day': is_all_day,
                'status': 'scheduled',
                'event_type': 'meeting',
                'timezone': start.get('timeZone', 'UTC'),
                'email_account_id': email_account.id,
                'organization_id': email_account.organization_id,
                'created_by': email_account.user_id,
                'created_at': created_at,
                'updated_at': updated_at,
                'sync_status': 'synced'
            }
            
        except Exception as e:
            logger.error(f"Error converting Google event: {str(e)}")
            return None
    
    def _convert_outlook_event(self, outlook_event: Dict[str, Any], email_account: EmailAccount) -> Optional[Dict[str, Any]]:
        """Convert Outlook event to our event format"""
        try:
            # Skip cancelled events
            if outlook_event.get('isCancelled'):
                return None
            
            start = outlook_event.get('start', {})
            end = outlook_event.get('end', {})
            
            start_date = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00'))
            
            # Get creation and update times
            created_at = datetime.fromisoformat(outlook_event.get('createdDateTime', datetime.utcnow().isoformat()).replace('Z', '+00:00'))
            updated_at = datetime.fromisoformat(outlook_event.get('lastModifiedDateTime', datetime.utcnow().isoformat()).replace('Z', '+00:00'))
            
            return {
                'external_id': outlook_event['id'],
                'title': outlook_event.get('subject', 'No Title'),
                'description': outlook_event.get('body', {}).get('content', ''),
                'start_date': start_date,
                'end_date': end_date,
                'location': outlook_event.get('location', {}).get('displayName', ''),
                'is_all_day': outlook_event.get('isAllDay', False),
                'status': 'scheduled',
                'event_type': 'meeting',
                'timezone': start.get('timeZone', 'UTC'),
                'email_account_id': email_account.id,
                'organization_id': email_account.organization_id,
                'created_by': email_account.user_id,
                'created_at': created_at,
                'updated_at': updated_at,
                'sync_status': 'synced'
            }
            
        except Exception as e:
            logger.error(f"Error converting Outlook event: {str(e)}")
            return None
    
    async def _create_or_update_event(self, event_data: Dict[str, Any], email_account: EmailAccount) -> str:
        """Create or update event in our database"""
        try:
            # Convert string dates to datetime objects
            if isinstance(event_data['start_date'], str):
                event_data['start_date'] = datetime.fromisoformat(event_data['start_date'])
            if isinstance(event_data['end_date'], str):
                event_data['end_date'] = datetime.fromisoformat(event_data['end_date'])
            if isinstance(event_data['created_at'], str):
                event_data['created_at'] = datetime.fromisoformat(event_data['created_at'])
            if isinstance(event_data['updated_at'], str):
                event_data['updated_at'] = datetime.fromisoformat(event_data['updated_at'])

            # Ensure required fields are set
            event_data['organization_id'] = email_account.organization_id
            event_data['created_by'] = email_account.user_id
            event_data['sync_status'] = 'synced'

            # Check if event already exists (by external_id)
            existing_event = event.get_by_external_id(
                db=self.db,
                external_id=event_data['external_id'],
                organization_id=email_account.organization_id
            )
            
            if existing_event:
                # Update existing event
                updated_event = event.update(
                    db=self.db,
                    db_obj=existing_event,
                    obj_in=event_data
                )
                return 'updated'
            else:
                # Create new event
                new_event = event.create(
                    db=self.db,
                    obj_in=event_data
                )
                return 'created'
                
        except Exception as e:
            logger.error(f"Error creating/updating event: {str(e)}")
            self.db.rollback()
            raise  # Re-raise to be handled by the caller 