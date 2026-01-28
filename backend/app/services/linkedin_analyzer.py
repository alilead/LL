import re
import requests
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import hashlib
from .simple_linkedin_scraper import simple_linkedin_scraper

logger = logging.getLogger(__name__)

class LinkedInAnalyzer:
    """
    LinkedIn profile analysis system
    Extracts personality insights from LinkedIn data like Crystal Knows
    """
    
    def __init__(self):
        self.personality_keywords = self._load_personality_keywords()
        self.industry_patterns = self._load_industry_patterns()
        self.experience_weights = self._load_experience_weights()
    
    def analyze_linkedin_profile(self, linkedin_url: str, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract personality insights from LinkedIn profile URL
        """
        if not linkedin_url or "linkedin.com" not in linkedin_url:
            return self._fallback_analysis(lead_data)
        
        try:
            # Extract profile data from LinkedIn
            profile_data = self._extract_profile_data(linkedin_url, lead_data)
            
            # Analyze personality from profile
            personality_insights = self._analyze_personality_from_profile(profile_data)
            
            return personality_insights
            
        except Exception as e:
            logger.warning(f"LinkedIn analysis failed: {str(e)}")
            return self._fallback_analysis(lead_data)
    
    def _extract_profile_data(self, linkedin_url: str, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract profile data from LinkedIn (real scraping + fallback)
        """
        try:
            # Try real LinkedIn scraping first
            scraped_data = simple_linkedin_scraper.scrape_linkedin_profile(linkedin_url)
            
            if scraped_data and scraped_data.get("name") != "Unknown":
                # Use real scraped data
                profile_data = {
                    "profile_id": self._extract_profile_id(linkedin_url),
                    "headline": scraped_data.get("headline", lead_data.get("job_title", "")),
                    "summary": scraped_data.get("summary", ""),
                    "experience": scraped_data.get("experience", []),
                    "skills": scraped_data.get("skills", []),
                    "connections": scraped_data.get("connections", 500),
                    "activity_level": self._estimate_activity_level_from_data(scraped_data),
                    "post_style": self._analyze_post_style_from_data(scraped_data),
                    "data_source": "real_scraping"
                }
                logger.info(f"Successfully scraped LinkedIn profile: {linkedin_url}")
                return profile_data
        except Exception as e:
            logger.warning(f"Real LinkedIn scraping failed: {str(e)}")
        
        # Fallback to simulated data
        profile_id = self._extract_profile_id(linkedin_url)
        profile_data = {
            "profile_id": profile_id,
            "headline": lead_data.get("job_title", ""),
            "summary": self._generate_simulated_summary(lead_data),
            "experience": self._generate_simulated_experience(lead_data),
            "skills": self._generate_simulated_skills(lead_data),
            "connections": self._estimate_connections(lead_data),
            "activity_level": self._estimate_activity_level(lead_data),
            "post_style": self._analyze_post_style(lead_data),
            "data_source": "simulated"
        }
        
        return profile_data
    
    def _analyze_personality_from_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze personality from LinkedIn profile data
        """
        # Calculate DISC scores
        disc_scores = self._calculate_disc_from_linkedin(profile_data)
        
        # Extract personality traits
        traits = self._extract_personality_traits(profile_data)
        
        # Communication style analysis
        communication_style = self._analyze_communication_from_posts(profile_data)
        
        # Leadership style
        leadership_style = self._analyze_leadership_style(profile_data)
        
        # Confidence score
        confidence = self._calculate_linkedin_confidence(profile_data)
        
        return {
            "disc_scores": disc_scores,
            "primary_disc": self._determine_primary_disc(disc_scores),
            "personality_traits": traits,
            "communication_style": communication_style,
            "leadership_style": leadership_style,
            "confidence": confidence,
            "data_source": "linkedin_analysis"
        }
    
    def _calculate_disc_from_linkedin(self, profile_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculate DISC scores from LinkedIn data
        """
        scores = {"D": 0.5, "I": 0.5, "S": 0.5, "C": 0.5}
        
        # Headline analysis
        headline = profile_data.get("headline", "").lower()
        if any(word in headline for word in ["ceo", "founder", "director", "lead"]):
            scores["D"] += 0.2
        if any(word in headline for word in ["sales", "marketing", "business development"]):
            scores["I"] += 0.2
        if any(word in headline for word in ["support", "customer", "people", "hr"]):
            scores["S"] += 0.2
        if any(word in headline for word in ["analyst", "engineer", "technical", "data"]):
            scores["C"] += 0.2
        
        # Summary analysis
        summary = profile_data.get("summary", "").lower()
        d_keywords = ["results", "drive", "achieve", "lead", "execute", "deliver"]
        i_keywords = ["collaborate", "communicate", "inspire", "motivate", "engage"]
        s_keywords = ["support", "help", "assist", "team", "reliable", "patient"]
        c_keywords = ["analyze", "detail", "quality", "process", "systematic", "accurate"]
        
        for keyword in d_keywords:
            if keyword in summary:
                scores["D"] += 0.05
        for keyword in i_keywords:
            if keyword in summary:
                scores["I"] += 0.05
        for keyword in s_keywords:
            if keyword in summary:
                scores["S"] += 0.05
        for keyword in c_keywords:
            if keyword in summary:
                scores["C"] += 0.05
        
        # Connections analysis
        connections = profile_data.get("connections", 500)
        if connections > 1000:  # High connections = Influential (I)
            scores["I"] += 0.1
        elif connections < 200:  # Low connections = Compliant (C)
            scores["C"] += 0.1
        
        # Normalize scores
        for disc_type in scores:
            scores[disc_type] = max(0.1, min(0.9, scores[disc_type]))
        
        return scores
    
    def _extract_personality_traits(self, profile_data: Dict[str, Any]) -> List[str]:
        """
        Extract personality traits from LinkedIn data
        """
        traits = []
        summary = profile_data.get("summary", "").lower()
        
        trait_keywords = {
            "innovative": ["innovative", "creative", "disruptive"],
            "analytical": ["analytical", "data-driven", "metrics"],
            "collaborative": ["collaborative", "team", "partnership"],
            "results-oriented": ["results", "achievement", "performance"],
            "strategic": ["strategic", "vision", "planning"],
            "customer-focused": ["customer", "client", "user"]
        }
        
        for trait, keywords in trait_keywords.items():
            if any(keyword in summary for keyword in keywords):
                traits.append(trait)
        
        return traits[:4]  # Max 4 traits
    
    def _analyze_communication_from_posts(self, profile_data: Dict[str, Any]) -> List[str]:
        """
        Analyze communication style from post patterns
        """
        post_style = profile_data.get("post_style", "professional")
        
        communication_styles = {
            "professional": ["formal", "structured"],
            "casual": ["informal", "friendly"],
            "thought_leader": ["insightful", "educational"],
            "technical": ["detailed", "analytical"]
        }
        
        return communication_styles.get(post_style, ["professional"])
    
    def _analyze_leadership_style(self, profile_data: Dict[str, Any]) -> str:
        """
        Analyze leadership style
        """
        headline = profile_data.get("headline", "").lower()
        experience = profile_data.get("experience", [])
        
        leadership_roles = sum(1 for exp in experience 
                             if any(role in exp.get("title", "").lower() 
                                   for role in ["manager", "director", "lead", "head", "ceo"]))
        
        if leadership_roles >= 2:
            return "Experienced Leader"
        elif leadership_roles >= 1:
            return "Emerging Leader"
        else:
            return "Individual Contributor"
    
    def _generate_simulated_summary(self, lead_data: Dict[str, Any]) -> str:
        """
        Generate simulated LinkedIn summary from lead data
        """
        job_title = lead_data.get("job_title", "Professional")
        industry = lead_data.get("industry", "Business")
        
        if "ceo" in job_title.lower():
            return f"Experienced {job_title} driving innovation in {industry}. Passionate about building teams and delivering results."
        elif "engineer" in job_title.lower():
            return f"Skilled {job_title} with expertise in {industry}. Focused on quality and innovation."
        elif "sales" in job_title.lower():
            return f"Results-driven {job_title} with proven track record in {industry}. Expert in relationship building."
        else:
            return f"Experienced {job_title} in {industry} focused on delivering value."
    
    def _generate_simulated_experience(self, lead_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate simulated experience data
        """
        job_title = lead_data.get("job_title", "Professional")
        company = lead_data.get("company", "Company")
        
        return [
            {
                "title": job_title,
                "company": company,
                "duration": "2+ years"
            }
        ]
    
    def _generate_simulated_skills(self, lead_data: Dict[str, Any]) -> List[str]:
        """
        Generate simulated skills based on job title
        """
        job_title = lead_data.get("job_title", "").lower()
        
        if "engineer" in job_title:
            return ["Software Development", "Problem Solving", "Technical Leadership"]
        elif "sales" in job_title:
            return ["Sales Strategy", "Relationship Building", "Negotiation"]
        elif "marketing" in job_title:
            return ["Digital Marketing", "Content Strategy", "Analytics"]
        else:
            return ["Leadership", "Communication", "Problem Solving"]
    
    def _estimate_connections(self, lead_data: Dict[str, Any]) -> int:
        """
        Estimate connection count based on job title
        """
        job_title = lead_data.get("job_title", "").lower()
        
        if any(word in job_title for word in ["ceo", "director"]):
            return 1200
        elif any(word in job_title for word in ["sales", "marketing"]):
            return 800
        else:
            return 500
    
    def _estimate_activity_level(self, lead_data: Dict[str, Any]) -> str:
        """
        Estimate activity level
        """
        job_title = lead_data.get("job_title", "").lower()
        
        if any(word in job_title for word in ["marketing", "sales"]):
            return "high"
        elif any(word in job_title for word in ["engineer", "analyst"]):
            return "low"
        else:
            return "medium"
    
    def _analyze_post_style(self, lead_data: Dict[str, Any]) -> str:
        """
        Analyze posting style
        """
        job_title = lead_data.get("job_title", "").lower()
        
        if any(word in job_title for word in ["ceo", "founder"]):
            return "thought_leader"
        elif any(word in job_title for word in ["engineer", "technical"]):
            return "technical"
        else:
            return "professional"
    
    def _estimate_activity_level_from_data(self, scraped_data: Dict[str, Any]) -> str:
        """
        Estimate activity level from scraped data
        """
        connections = scraped_data.get("connections", 500)
        skills_count = len(scraped_data.get("skills", []))
        
        if connections > 1000 and skills_count > 8:
            return "high"
        elif connections < 200 and skills_count < 4:
            return "low"
        else:
            return "medium"
    
    def _analyze_post_style_from_data(self, scraped_data: Dict[str, Any]) -> str:
        """
        Analyze post style from scraped data
        """
        headline = scraped_data.get("headline", "").lower()
        summary = scraped_data.get("summary", "").lower()
        
        if any(word in headline for word in ["ceo", "founder", "entrepreneur"]):
            return "thought_leader"
        elif any(word in headline for word in ["engineer", "developer", "technical"]):
            return "technical"
        elif any(word in summary for word in ["passionate", "excited", "love"]):
            return "casual"
        else:
            return "professional"
    
    def _extract_profile_id(self, linkedin_url: str) -> str:
        """
        Extract profile ID from LinkedIn URL
        """
        match = re.search(r'linkedin\.com/in/([^/?]+)', linkedin_url)
        if match:
            return match.group(1)
        return hashlib.md5(linkedin_url.encode()).hexdigest()[:8]
    
    def _determine_primary_disc(self, disc_scores: Dict[str, float]) -> str:
        """
        Determine primary DISC type
        """
        sorted_scores = sorted(disc_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_scores[0][0]
    
    def _calculate_linkedin_confidence(self, profile_data: Dict[str, Any]) -> float:
        """
        Calculate LinkedIn analysis confidence
        """
        data_source = profile_data.get("data_source", "simulated")
        
        if data_source == "real_scraping":
            # High confidence for real scraped data
            base_confidence = 0.95
            
            # Adjust based on data completeness
            summary_length = len(profile_data.get("summary", ""))
            skills_count = len(profile_data.get("skills", []))
            experience_count = len(profile_data.get("experience", []))
            
            if summary_length > 100 and skills_count > 5 and experience_count > 1:
                return min(0.98, base_confidence + 0.03)
            elif summary_length > 50 and skills_count > 3:
                return base_confidence
            else:
                return max(0.85, base_confidence - 0.1)
        else:
            # Lower confidence for simulated data
            return 0.75
    
    def _fallback_analysis(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback analysis when LinkedIn fails
        """
        return {
            "disc_scores": {"D": 0.5, "I": 0.5, "S": 0.5, "C": 0.5},
            "primary_disc": "D",
            "personality_traits": ["professional"],
            "communication_style": ["standard"],
            "leadership_style": "Unknown",
            "confidence": 0.3,
            "data_source": "fallback"
        }
    
    def _load_personality_keywords(self) -> Dict[str, List[str]]:
        """
        Personality keyword mappings
        """
        return {}  # Placeholder for future expansion
    
    def _load_industry_patterns(self) -> Dict[str, Dict[str, float]]:
        """
        Industry pattern mappings
        """
        return {}  # Placeholder for future expansion
    
    def _load_experience_weights(self) -> Dict[str, float]:
        """
        Experience weight mappings
        """
        return {}  # Placeholder for future expansion

# Global instance
linkedin_analyzer = LinkedInAnalyzer() 