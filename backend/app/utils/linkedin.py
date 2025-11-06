from datetime import datetime, timedelta
from app.models.user import User
from app.core.linkedin import LinkedInClient
from sqlalchemy.orm import Session

async def refresh_linkedin_token_if_needed(user: User, db: Session) -> bool:
    """Refresh LinkedIn token if needed"""
    if not user.linkedin_token:
        return False

    # Refresh token if expiring soon (e.g., 1 hour before expiration)
    if user.linkedin_token_expires - timedelta(hours=1) <= datetime.utcnow():
        try:
            linkedin = LinkedInClient()
            token_data = await linkedin.refresh_token(user.linkedin_refresh_token)

            user.linkedin_token = token_data['access_token']
            user.linkedin_refresh_token = token_data.get('refresh_token', user.linkedin_refresh_token)
            user.linkedin_token_expires = datetime.utcnow() + timedelta(seconds=token_data['expires_in'])

            db.commit()
            return True
        except Exception as e:
            # Remove connection if token refresh fails
            user.linkedin_token = None
            user.linkedin_refresh_token = None
            user.linkedin_token_expires = None
            db.commit()
            return False
            
    return True 