import httpx
from typing import Dict, Any, Optional, List
from app.core.constants import CRYSTAL_KNOWS
import logging

logger = logging.getLogger(__name__)

class CrystalService:
    def __init__(self):
        self.api_key = CRYSTAL_KNOWS['API_KEY']
        self.base_url = CRYSTAL_KNOWS['BASE_URL']
        self.endpoints = CRYSTAL_KNOWS['ENDPOINTS']

    async def get_personality_data(self, email: str) -> Dict[str, Any]:
        """Get comprehensive personality data from Crystal Knows API"""
        
        try:
            async with httpx.AsyncClient() as client:
                # Get personality profile
                personality_response = await client.get(
                    f"{self.base_url}{self.endpoints['personality']}",
                    params={'email': email},
                    headers={'Authorization': f'Bearer {self.api_key}'}
                )
                personality_data = personality_response.json()

                # Get communication recommendations
                communication_response = await client.get(
                    f"{self.base_url}{self.endpoints['communication']}",
                    params={'email': email},
                    headers={'Authorization': f'Bearer {self.api_key}'}
                )
                communication_data = communication_response.json()

                # Get sales recommendations
                recommendations_response = await client.get(
                    f"{self.base_url}{self.endpoints['recommendations']}",
                    params={'email': email},
                    headers={'Authorization': f'Bearer {self.api_key}'}
                )
                recommendations_data = recommendations_response.json()

                # Combine all data into comprehensive profile
                return self._format_crystal_response(
                    personality_data, 
                    communication_data, 
                    recommendations_data
                )
                
        except httpx.HTTPStatusError as e:
            logger.warning(f"Crystal Knows API error for {email}: {e.response.status_code}")
            return await self._fallback_analysis(email)
        except Exception as e:
            logger.error(f"Crystal Knows service error: {str(e)}")
            return await self._fallback_analysis(email)

    async def search_person(self, first_name: str, last_name: str, company: Optional[str] = None) -> Dict[str, Any]:
        """Search for person in Crystal Knows database"""
        
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    'first_name': first_name,
                    'last_name': last_name
                }
                if company:
                    params['company'] = company
                
                response = await client.get(
                    f"{self.base_url}/people/search",
                    params=params,
                    headers={'Authorization': f'Bearer {self.api_key}'}
                )
                
                return response.json()
                
        except Exception as e:
            logger.error(f"Crystal Knows search error: {str(e)}")
            return {'found': False, 'error': str(e)}

    async def get_behavioral_insights(self, email: str) -> Dict[str, Any]:
        """Get detailed behavioral insights"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/insights/behavioral",
                    params={'email': email},
                    headers={'Authorization': f'Bearer {self.api_key}'}
                )
                
                behavioral_data = response.json()
                return self._format_behavioral_insights(behavioral_data)
                
        except Exception as e:
            logger.error(f"Behavioral insights error: {str(e)}")
            return self._generate_fallback_behavioral_insights()

    def _format_crystal_response(self, personality: Dict, communication: Dict, recommendations: Dict) -> Dict[str, Any]:
        """Format Crystal Knows API response into our standard format"""
        
        return {
            'personality_type': personality.get('disc_type', 'D'),
            'personality_description': personality.get('description', ''),
            'disc_scores': {
                'D': personality.get('dominance', 0),
                'I': personality.get('influence', 0),
                'S': personality.get('steadiness', 0),
                'C': personality.get('compliance', 0)
            },
            'big_five': {
                'openness': personality.get('openness', 0.5),
                'conscientiousness': personality.get('conscientiousness', 0.5),
                'extraversion': personality.get('extraversion', 0.5),
                'agreeableness': personality.get('agreeableness', 0.5),
                'neuroticism': personality.get('neuroticism', 0.5)
            },
            'communication_style': {
                'primary_style': communication.get('primary_style', 'direct'),
                'preferences': communication.get('preferences', []),
                'avoid': communication.get('avoid', []),
                'tone_suggestions': communication.get('tone_suggestions', [])
            },
            'sales_insights': {
                'approach': recommendations.get('sales_approach', ''),
                'objections': recommendations.get('likely_objections', []),
                'motivators': recommendations.get('motivators', []),
                'decision_style': recommendations.get('decision_style', ''),
                'meeting_preferences': recommendations.get('meeting_preferences', {})
            },
            'behavioral_predictions': {
                'work_style': personality.get('work_style', ''),
                'stress_response': personality.get('stress_response', ''),
                'team_role': personality.get('team_role', ''),
                'leadership_style': personality.get('leadership_style', '')
            },
            'confidence_score': personality.get('confidence', 0.8),
            'data_source': 'crystal_knows'
        }

    def _format_behavioral_insights(self, data: Dict) -> Dict[str, Any]:
        """Format behavioral insights from Crystal Knows"""
        
        return {
            'decision_making': {
                'style': data.get('decision_style', 'analytical'),
                'speed': data.get('decision_speed', 'moderate'),
                'factors': data.get('decision_factors', [])
            },
            'communication_patterns': {
                'preferred_channels': data.get('communication_channels', []),
                'response_time': data.get('response_patterns', 'normal'),
                'meeting_style': data.get('meeting_preferences', {})
            },
            'work_preferences': {
                'environment': data.get('work_environment', ''),
                'collaboration_style': data.get('collaboration', ''),
                'task_management': data.get('task_style', '')
            },
            'stress_indicators': {
                'triggers': data.get('stress_triggers', []),
                'responses': data.get('stress_responses', []),
                'management_tips': data.get('stress_management', [])
            }
        }

    async def _fallback_analysis(self, email: str) -> Dict[str, Any]:
        """Fallback analysis when Crystal Knows API is not available"""
        
        # Use our enhanced personality service as fallback
        from .enhanced_personality_service import enhanced_personality_service
        
        fallback_data = enhanced_personality_service.analyze_personality({'email': email})
        
        return {
            'personality_type': fallback_data.get('disc_profile', 'D'),
            'personality_description': 'Generated by internal analysis',
            'disc_scores': fallback_data.get('disc_scores', {}),
            'big_five': {
                'openness': 0.5,
                'conscientiousness': 0.5,
                'extraversion': 0.5,
                'agreeableness': 0.5,
                'neuroticism': 0.5
            },
            'communication_style': {
                'primary_style': 'direct',
                'preferences': fallback_data.get('communication_style', []),
                'avoid': [],
                'tone_suggestions': []
            },
            'sales_insights': {
                'approach': fallback_data.get('sales_approach', ''),
                'objections': [],
                'motivators': [],
                'decision_style': 'analytical',
                'meeting_preferences': {}
            },
            'behavioral_predictions': {
                'work_style': 'analytical',
                'stress_response': 'problem-solving',
                'team_role': 'contributor',
                'leadership_style': 'collaborative'
            },
            'confidence_score': fallback_data.get('confidence', 0.6),
            'data_source': 'internal_analysis'
        }

    def _generate_fallback_behavioral_insights(self) -> Dict[str, Any]:
        """Generate fallback behavioral insights"""
        
        return {
            'decision_making': {
                'style': 'analytical',
                'speed': 'moderate',
                'factors': ['data', 'logic', 'experience']
            },
            'communication_patterns': {
                'preferred_channels': ['email', 'phone'],
                'response_time': 'normal',
                'meeting_style': {'format': 'structured', 'duration': 'moderate'}
            },
            'work_preferences': {
                'environment': 'professional',
                'collaboration_style': 'team-oriented',
                'task_management': 'organized'
            },
            'stress_indicators': {
                'triggers': ['time pressure', 'unclear requirements'],
                'responses': ['increased focus', 'seeks clarification'],
                'management_tips': ['provide clear timelines', 'regular check-ins']
            }
        }

# Global instance
crystal_service = CrystalService()
