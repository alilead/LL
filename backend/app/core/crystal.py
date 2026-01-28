import aiohttp
from typing import Optional, Dict, Any
from app.core.config import settings

class CrystalKnowsAPI:
    def __init__(self):
        self.api_key = settings.CRYSTAL_API_KEY
        self.base_url = settings.CRYSTAL_API_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/{endpoint}"
        
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method,
                url=url,
                headers=self.headers,
                params=params,
                json=data
            ) as response:
                if response.status == 429:
                    raise ValueError("API rate limit exceeded")
                elif response.status != 200:
                    error_data = await response.json()
                    raise ValueError(f"API request failed: {error_data.get('message', 'Unknown error')}")
                
                return await response.json()

    async def search_by_email(self, email: str) -> Dict[str, Any]:
        """Search for a person's profile using their email address"""
        return await self._make_request(
            method="GET",
            endpoint="people/search",
            params={"email": email}
        )

    async def search_by_linkedin(self, linkedin_url: str) -> Dict[str, Any]:
        """Search for a person's profile using their LinkedIn URL"""
        return await self._make_request(
            method="GET",
            endpoint="people/search",
            params={"linkedin_url": linkedin_url}
        )

    async def search_by_name(
        self,
        first_name: str,
        last_name: str,
        company: Optional[str] = None
    ) -> Dict[str, Any]:
        """Search for a person's profile using their name and optionally company"""
        params = {
            "first_name": first_name,
            "last_name": last_name
        }
        if company:
            params["company"] = company
            
        return await self._make_request(
            method="GET",
            endpoint="people/search",
            params=params
        )

    async def get_profile(self, profile_id: str) -> Dict[str, Any]:
        """Get a person's full profile using their Crystal profile ID"""
        return await self._make_request(
            method="GET",
            endpoint=f"profiles/{profile_id}"
        )

    async def get_recommendations(
        self,
        profile_id: str,
        context: str = "sales"
    ) -> Dict[str, Any]:
        """Get personalized recommendations for interacting with a person"""
        return await self._make_request(
            method="GET",
            endpoint=f"profiles/{profile_id}/recommendations",
            params={"context": context}
        )

    async def get_comparison(
        self,
        profile_id1: str,
        profile_id2: str
    ) -> Dict[str, Any]:
        """Get a comparison between two people's personalities"""
        return await self._make_request(
            method="GET",
            endpoint="comparisons",
            params={
                "profile1_id": profile_id1,
                "profile2_id": profile_id2
            }
        )

    async def get_team_analysis(
        self,
        profile_ids: list[str]
    ) -> Dict[str, Any]:
        """Get an analysis of team dynamics based on multiple profiles"""
        return await self._make_request(
            method="POST",
            endpoint="teams/analyze",
            data={"profile_ids": profile_ids}
        )

    async def get_communication_advice(
        self,
        profile_id: str,
        scenario: str
    ) -> Dict[str, Any]:
        """Get specific communication advice for a given scenario"""
        return await self._make_request(
            method="GET",
            endpoint=f"profiles/{profile_id}/communication",
            params={"scenario": scenario}
        )

crystal_api = CrystalKnowsAPI()
