import aiohttp
from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.core.security import token_encryption
from typing import Optional, Dict, Any
import logging
import jwt
from fastapi import HTTPException
import base64
import json

logger = logging.getLogger(__name__)

class LinkedInClient:
    BASE_URL = "https://api.linkedin.com/v2"
    SCOPES = [
        'r_liteprofile',  # Required to retrieve the member's lite profile
        'r_emailaddress'  # Required to retrieve the member's email address
    ]
    
    def __init__(self):
        self.client_id = settings.LINKEDIN_CLIENT_ID
        self.client_secret = settings.LINKEDIN_CLIENT_SECRET
        self.redirect_uri = settings.LINKEDIN_REDIRECT_URI
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                connector=aiohttp.TCPConnector(
                    limit=100,
                    ttl_dns_cache=300
                )
            )
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()

    @rate_limit(limit=100, period=3600)  # 100 requests per hour
    async def get_profile_id_from_url(self, profile_url: str) -> str:
        """LinkedIn URL'sinden profil ID'sini çıkar"""
        try:
            # URL'den username veya ID'yi çıkar
            parts = profile_url.split('/')
            return parts[-1] if parts[-1] else parts[-2]
        except Exception as e:
            logger.error(f"Error extracting profile ID from URL: {str(e)}")
            raise ValueError("Invalid LinkedIn URL")

    @rate_limit(limit=50, period=3600)  # 50 messages per hour
    async def send_message(self, profile_id: str, message: str, access_token: str) -> dict:
        """LinkedIn mesajı gönder"""
        try:
            session = await self._get_session()
            url = f"{self.BASE_URL}/messages/v2/conversations"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            payload = {
                "recipients": [{"person": {"id": profile_id}}],
                "message": {"body": message}
            }
            
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status != 201:
                    text = await response.text()
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"LinkedIn API error: {text}"
                    )
                return await response.json()
        except Exception as e:
            logger.error(f"Error sending LinkedIn message: {str(e)}")
            raise

    @rate_limit(limit=40, period=3600)  # 40 connection requests per hour
    async def send_connection(self, profile_id: str, message: Optional[str] = None, access_token: Optional[str] = None, user_id: Optional[int] = None) -> dict:
        """Generate LinkedIn connection deep link instead of API call"""
        try:
            if not profile_id:
                logger.error("Error: profile_id is required for sending connection request")
                raise ValueError("LinkedIn profile ID is required")
                
            # Log the user ID if provided for better debugging
            user_context = f"User (id: {user_id})" if user_id else "User"
                
            # Clean up profile_id - remove any URL components
            if 'linkedin.com/in/' in profile_id:
                # Extract profile ID from full LinkedIn URL
                profile_id = profile_id.split('linkedin.com/in/')[-1]
            if '/' in profile_id:
                profile_id = profile_id.split('/')[0]
            if '?' in profile_id:
                profile_id = profile_id.split('?')[0]
                
            logger.info(f"Generating LinkedIn connection deep link for profile: {profile_id}")
            
            # Create LinkedIn deep link for connection request
            # This opens LinkedIn app/website with pre-filled connection request
            connection_url = f"https://www.linkedin.com/in/{profile_id}/"
            
            # If message is provided, we can include it as a note in the URL
            if message and len(message.strip()) > 0:
                # LinkedIn supports adding a message through their connect flow
                # The user will need to copy-paste the message manually
                connection_url += f"?message={message[:300]}"  # Limit to 300 chars
            
            logger.info(f"Generated LinkedIn connection URL for profile: {profile_id}")
            
            return {
                "success": True, 
                "message": "LinkedIn connection link generated successfully",
                "connection_url": connection_url,
                "instruction": "Click the link to open LinkedIn and send connection request",
                "note": f"Message to include: {message}" if message else None
            }
            
        except Exception as e:
            logger.error(f"Error generating LinkedIn connection link: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate LinkedIn connection link: {str(e)}"
            )

    async def get_access_token(self, code: str, code_verifier: str = None) -> dict:
        """Get LinkedIn OAuth token"""
        try:
            session = await self._get_session()
            url = "https://www.linkedin.com/oauth/v2/accessToken"
            
            # Use the client secret as is - no prefix removal
            client_secret = self.client_secret
                
            # Log without showing the full secret
            secret_length = len(client_secret)
            secret_preview = client_secret[:4] + "*" * (secret_length - 4) if secret_length > 4 else "****"
            logger.info(f"Using client secret of length {secret_length}, preview: {secret_preview}")
            
            # Prepare the payload
            payload = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': self.redirect_uri,
                'client_id': self.client_id,
                'client_secret': client_secret
            }
            
            # Add code_verifier if provided (PKCE flow)
            if code_verifier:
                payload['code_verifier'] = code_verifier
            
            # Enhanced logging (without exposing sensitive data)
            logger.info(f"LinkedIn token request - Client ID: {self.client_id}")
            logger.info(f"LinkedIn token request - Redirect URI: {self.redirect_uri}")
            logger.info(f"LinkedIn token request - Code length: {len(code)}")
            if code_verifier:
                logger.info(f"LinkedIn token request - Using PKCE with code_verifier length: {len(code_verifier)}")
            else:
                logger.info("LinkedIn token request - Not using PKCE (no code_verifier provided)")
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
            
            import json
            from urllib.parse import urlencode, quote
            
            # Ensure proper URL encoding of special characters in client secret
            client_secret_encoded = quote(client_secret)
            
            # Prepare payload with encoded client secret
            payload = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': self.redirect_uri,
                'client_id': self.client_id,
                'client_secret': client_secret_encoded
            }
            
            # Add code_verifier if provided (PKCE flow)
            if code_verifier:
                payload['code_verifier'] = code_verifier
            
            # URL encode the entire payload
            encoded_payload = urlencode(payload)
            
            # Log request details (without sensitive info)
            logger.info(f"LinkedIn token request URL: {url}")
            logger.info(f"LinkedIn token request payload keys: {list(payload.keys())}")
            logger.info(f"Using PKCE: {bool(code_verifier)}")
            logger.info(f"Client secret format - Length: {len(client_secret)}, Has WPL_ prefix: {client_secret.startswith('WPL_')}, Has == suffix: {client_secret.endswith('==')}")
            
            # Make the API request with proper headers
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'TheLeadLab/1.0'
            }
            
            async with session.post(url, data=encoded_payload, headers=headers) as response:
                text = await response.text()
                logger.info(f"LinkedIn token response status: {response.status}")
                logger.info(f"LinkedIn token response headers: {dict(response.headers)}")
                
                try:
                    response_data = json.loads(text)
                    logger.info(f"LinkedIn token response type: {type(response_data)}")
                    logger.info(f"LinkedIn token response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Not a dict'}")
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse LinkedIn response as JSON: {text}")
                
                if response.status != 200:
                    logger.error(f"LinkedIn token error: {text}")
                    
                    # Try to parse error response
                    error_msg = "Unknown LinkedIn API error"
                    try:
                        error_data = json.loads(text)
                        error_msg = f"LinkedIn API error: {error_data.get('error_description', error_data.get('error', 'Unknown error'))}"
                    except:
                        error_msg = f"LinkedIn API error: {text}"
                    
                    # Special handling for common errors
                    if "invalid_client" in text:
                        error_msg = "LinkedIn application credentials are invalid. Please check your LinkedIn Client ID and Client Secret."
                        logger.error(f"LinkedIn client authentication failed. ID: {self.client_id}, Secret preview: {secret_preview}")
                    elif "authorization_pending" in text:
                        error_msg = "LinkedIn authorization is pending. Please try again."
                    elif "invalid_request" in text and "code_verifier" in text:
                        error_msg = "LinkedIn PKCE verification failed. Please try again."
                    
                    raise HTTPException(
                        status_code=response.status,
                        detail=error_msg
                    )
                
                # Success - parse and return the token data
                try:
                    token_data = json.loads(text)
                    logger.info("Successfully obtained LinkedIn access token")
                    return token_data
                except json.JSONDecodeError:
                    logger.error(f"Error parsing LinkedIn token response: {text}")
                    raise HTTPException(
                        status_code=500,
                        detail="Error parsing LinkedIn token response"
                    )
                    
        except HTTPException:
            # Re-raise HTTP exceptions without additional wrapping
            raise
        except Exception as e:
            logger.error(f"Error getting LinkedIn access token: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get LinkedIn access token: {str(e)}"
            )

    async def refresh_token(self, encrypted_refresh_token: str) -> dict:
        """LinkedIn token'ı yenile"""
        try:
            refresh_token = token_encryption.decrypt_token(encrypted_refresh_token)
            session = await self._get_session()
            url = "https://www.linkedin.com/oauth/v2/accessToken"
            payload = {
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
                'client_id': self.client_id,
                'client_secret': self.client_secret
            }
            
            async with session.post(url, data=payload) as response:
                if response.status != 200:
                    text = await response.text()
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"LinkedIn token refresh error: {text}"
                    )
                    
                token_data = await response.json()
                # Encrypt new tokens
                token_data['access_token'] = token_encryption.encrypt_token(
                    token_data['access_token']
                )
                if 'refresh_token' in token_data:
                    token_data['refresh_token'] = token_encryption.encrypt_token(
                        token_data['refresh_token']
                    )
                return token_data
        except Exception as e:
            logger.error(f"Error refreshing LinkedIn token: {str(e)}")
            raise

    async def get_profile(self, encrypted_access_token: str) -> dict:
        """LinkedIn profil bilgilerini getir"""
        try:
            access_token = token_encryption.decrypt_token(encrypted_access_token)
            session = await self._get_session()
            url = f"{self.BASE_URL}/me"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            params = {
                "projection": "(id,firstName,lastName,profilePicture(displayImage~:playableStreams))"
            }
            
            async with session.get(url, headers=headers, params=params) as response:
                if response.status != 200:
                    text = await response.text()
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"LinkedIn API error: {text}"
                    )
                profile_data = await response.json()
                
                # Get email address
                email_url = f"{self.BASE_URL}/emailAddress?q=members&projection=(elements*(handle~))"
                async with session.get(email_url, headers=headers) as email_response:
                    if email_response.status == 200:
                        email_data = await email_response.json()
                        if 'elements' in email_data and len(email_data['elements']) > 0:
                            email = email_data['elements'][0].get('handle~', {}).get('emailAddress')
                            profile_data['emailAddress'] = email
                    
                return profile_data
        except Exception as e:
            logger.error(f"Error getting LinkedIn profile: {str(e)}")
            raise

    async def get_userinfo(self, encrypted_access_token: str) -> Dict[str, Any]:
        """Get user info from LinkedIn's UserInfo endpoint"""
        try:
            access_token = token_encryption.decrypt_token(encrypted_access_token)
            session = await self._get_session()
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            async with session.get(
                "https://api.linkedin.com/v2/userinfo",
                headers=headers
            ) as response:
                if response.status != 200:
                    text = await response.text()
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"LinkedIn API error: {text}"
                    )
                return await response.json()
        except Exception as e:
            logger.error(f"Error getting LinkedIn user info: {str(e)}")
            raise

    async def validate_id_token(self, id_token: str) -> None:
        """Validate the ID token from LinkedIn"""
        try:
            session = await self._get_session()
            async with session.get(
                "https://www.linkedin.com/oauth/openid/jwks"
            ) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=response.status,
                        detail="Failed to get LinkedIn JWKS"
                    )
                jwks = await response.json()

            header = jwt.get_unverified_header(id_token)
            key = [k for k in jwks['keys'] if k['kid'] == header['kid']][0]
            
            decoded = jwt.decode(
                id_token,
                key,
                algorithms=['RS256'],
                audience=settings.LINKEDIN_CLIENT_ID,
                issuer="https://www.linkedin.com"
            )
            
            return decoded
        except Exception as e:
            logger.error(f"ID token validation error: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail="Invalid ID token"
            )

    async def get_userinfo_direct(self, access_token: str) -> Dict[str, Any]:
        """Get user info from LinkedIn's UserInfo endpoint using a raw (non-encrypted) access token"""
        try:
            if not access_token:
                raise ValueError("Access token is required")
                
            logger.info(f"Getting user info with token of length: {len(access_token)}")
            session = await self._get_session()
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            async with session.get(
                "https://api.linkedin.com/v2/userinfo",
                headers=headers
            ) as response:
                if response.status != 200:
                    text = await response.text()
                    logger.error(f"LinkedIn userinfo error: {response.status} - {text}")
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"LinkedIn API error: {text}"
                    )
                data = await response.json()
                logger.info(f"Successfully retrieved LinkedIn user info for user: {data.get('name', 'Unknown')}")
                return data
        except Exception as e:
            logger.error(f"Error getting LinkedIn user info: {str(e)}")
            raise

linkedin_client = LinkedInClient() 