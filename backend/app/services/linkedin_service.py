from typing import Optional
import requests
from fastapi import HTTPException
from app.core.config import settings

class LinkedInService:
    def __init__(self):
        self.api_url = "https://api.linkedin.com/v2"
        
    async def get_access_token(self, authorization_code: str) -> dict:
        """LinkedIn OAuth2 token exchange"""
        try:
            response = requests.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "authorization_code",
                    "code": authorization_code,
                    "client_id": settings.LINKEDIN_CLIENT_ID,
                    "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                    "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
                }
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=400, detail=f"LinkedIn token exchange failed: {str(e)}")

    async def send_message(self, access_token: str, recipient_id: str, message: str) -> dict:
        """Send a message to a LinkedIn connection"""
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            
            # Create a conversation
            conversation_response = requests.post(
                f"{self.api_url}/messages/conversations",
                headers=headers,
                json={
                    "recipients": [{"person": recipient_id}],
                    "body": message
                }
            )
            conversation_response.raise_for_status()
            return conversation_response.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=400, detail=f"Failed to send LinkedIn message: {str(e)}")

    async def get_profile(self, access_token: str) -> dict:
        """Get LinkedIn profile information"""
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
            }
            response = requests.get(
                f"{self.api_url}/me",
                headers=headers,
                params={
                    "projection": "(id,firstName,lastName,profilePicture(displayImage~:playableStreams))"
                }
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=400, detail=f"Failed to get LinkedIn profile: {str(e)}")

linkedin_service = LinkedInService()
