import hashlib
import re
from typing import Dict, List, Any, Tuple
from datetime import datetime
import logging
from .linkedin_analyzer import linkedin_analyzer

logger = logging.getLogger(__name__)

class EnhancedPersonalityService:
    """
    Crystal Knows style enhanced personality analysis system
    Provides real DISC profile variety and detailed analysis
    """
    
    def __init__(self):
        pass
    
    def analyze_personality(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive personality analysis using multiple factors including LinkedIn
        """
        # Extract lead information
        job_title = lead_data.get("job_title", "").lower()
        company = lead_data.get("company", "").lower()
        industry = lead_data.get("industry", "").lower()
        email = lead_data.get("email", "").lower()
        first_name = lead_data.get("first_name", "")
        last_name = lead_data.get("last_name", "")
        linkedin_url = lead_data.get("linkedin_url", "")
        
        # Generate unique seed for consistent but varied results
        seed = self._generate_personality_seed(job_title, company, email, first_name, last_name)
        
        # LinkedIn analysis (if available)
        linkedin_insights = None
        if linkedin_url:
            try:
                linkedin_insights = linkedin_analyzer.analyze_linkedin_profile(linkedin_url, lead_data)
            except Exception as e:
                logger.warning(f"LinkedIn analysis failed: {str(e)}")
        
        # Multi-factor analysis
        factors = {
            "job_title_factor": self._analyze_job_title(job_title),
            "company_culture_factor": self._analyze_company_culture(company, industry),
            "industry_factor": self._analyze_industry_traits(industry),
            "seniority_factor": self._analyze_seniority_level(job_title),
            "email_domain_factor": self._analyze_email_domain(email),
            "linkedin_factor": linkedin_insights,
            "personality_seed": seed
        }
        
        # Calculate DISC profile
        disc_scores = self._calculate_disc_scores(factors)
        primary_disc = self._determine_primary_disc(disc_scores)
        
        # Generate personality traits
        personality_traits = self._generate_personality_traits(primary_disc, factors)
        
        # Communication style analysis
        communication_style = self._analyze_communication_style(primary_disc, factors)
        
        # Sales approach recommendations
        sales_approach = self._generate_sales_approach(primary_disc, factors)
        
        # Calculate confidence score
        confidence = self._calculate_confidence_score(factors)
        
        return {
            "disc_profile": primary_disc,
            "personality_type": primary_disc[0],
            "disc_scores": disc_scores,
            "traits": personality_traits,
            "communication_style": communication_style,
            "sales_approach": sales_approach,
            "confidence": confidence,
            "analysis_factors": factors,
            "analysis_method": "enhanced_rule_based"
        }
    
    def _generate_personality_seed(self, job_title: str, company: str, email: str, 
                                 first_name: str, last_name: str) -> int:
        """Generate consistent seed for personality variation"""
        combined = f"{job_title}_{company}_{email}_{first_name}_{last_name}"
        return int(hashlib.md5(combined.encode()).hexdigest()[:8], 16) % 1000
    
    def _analyze_job_title(self, job_title: str) -> Dict[str, float]:
        """Analyze job title for personality indicators"""
        title_patterns = {
            # Executive/Leadership (High D)
            "ceo": {"D": 0.9, "I": 0.7, "S": 0.2, "C": 0.4},
            "president": {"D": 0.9, "I": 0.7, "S": 0.3, "C": 0.5},
            "director": {"D": 0.8, "I": 0.6, "S": 0.4, "C": 0.6},
            "manager": {"D": 0.7, "I": 0.6, "S": 0.5, "C": 0.5},
            "head": {"D": 0.7, "I": 0.5, "S": 0.4, "C": 0.6},
            "chief": {"D": 0.8, "I": 0.6, "S": 0.3, "C": 0.5},
            
            # Sales/Marketing (High I)
            "sales": {"D": 0.6, "I": 0.9, "S": 0.4, "C": 0.3},
            "marketing": {"D": 0.5, "I": 0.8, "S": 0.4, "C": 0.4},
            "business development": {"D": 0.7, "I": 0.8, "S": 0.4, "C": 0.4},
            "account": {"D": 0.5, "I": 0.7, "S": 0.6, "C": 0.4},
            
            # Support/HR (High S)
            "support": {"D": 0.3, "I": 0.6, "S": 0.8, "C": 0.5},
            "customer success": {"D": 0.4, "I": 0.7, "S": 0.8, "C": 0.5},
            "hr": {"D": 0.4, "I": 0.6, "S": 0.8, "C": 0.6},
            "people": {"D": 0.3, "I": 0.7, "S": 0.9, "C": 0.4},
            
            # Technical/Analytical (High C)
            "engineer": {"D": 0.4, "I": 0.3, "S": 0.5, "C": 0.9},
            "developer": {"D": 0.4, "I": 0.3, "S": 0.5, "C": 0.9},
            "analyst": {"D": 0.3, "I": 0.3, "S": 0.4, "C": 0.9},
            "scientist": {"D": 0.3, "I": 0.3, "S": 0.5, "C": 0.9},
        }
        
        # Default scores
        scores = {"D": 0.5, "I": 0.5, "S": 0.5, "C": 0.5}
        
        # Check for matches
        for pattern, pattern_scores in title_patterns.items():
            if pattern in job_title:
                for disc_type, score in pattern_scores.items():
                    scores[disc_type] = max(scores[disc_type], score)
        
        return scores
    
    def _analyze_company_culture(self, company: str, industry: str) -> Dict[str, float]:
        """Analyze company culture impact on personality"""
        culture_indicators = {
            # Startup culture (High D, I)
            "startup": {"D": 0.7, "I": 0.7, "S": 0.4, "C": 0.5},
            "tech": {"D": 0.6, "I": 0.6, "S": 0.4, "C": 0.7},
            
            # Enterprise culture (High C, S)
            "enterprise": {"D": 0.5, "I": 0.4, "S": 0.7, "C": 0.8},
            "corporation": {"D": 0.5, "I": 0.4, "S": 0.7, "C": 0.8},
            "bank": {"D": 0.4, "I": 0.4, "S": 0.6, "C": 0.9},
        }
        
        scores = {"D": 0.5, "I": 0.5, "S": 0.5, "C": 0.5}
        
        combined_text = f"{company} {industry}".lower()
        for indicator, indicator_scores in culture_indicators.items():
            if indicator in combined_text:
                for disc_type, score in indicator_scores.items():
                    scores[disc_type] = (scores[disc_type] + score) / 2
        
        return scores
    
    def _analyze_industry_traits(self, industry: str) -> Dict[str, float]:
        """Industry-specific personality traits"""
        industry_profiles = {
            "technology": {"D": 0.6, "I": 0.6, "S": 0.4, "C": 0.8},
            "finance": {"D": 0.6, "I": 0.5, "S": 0.5, "C": 0.9},
            "healthcare": {"D": 0.4, "I": 0.5, "S": 0.8, "C": 0.8},
            "education": {"D": 0.3, "I": 0.6, "S": 0.8, "C": 0.7},
            "retail": {"D": 0.5, "I": 0.8, "S": 0.6, "C": 0.4},
            "consulting": {"D": 0.7, "I": 0.7, "S": 0.4, "C": 0.7},
        }
        
        for industry_key, scores in industry_profiles.items():
            if industry_key in industry.lower():
                return scores
        
        return {"D": 0.5, "I": 0.5, "S": 0.5, "C": 0.5}
    
    def _analyze_seniority_level(self, job_title: str) -> Dict[str, float]:
        """Seniority impact on personality expression"""
        seniority_levels = {
            "junior": {"D": 0.3, "I": 0.6, "S": 0.7, "C": 0.6},
            "senior": {"D": 0.6, "I": 0.6, "S": 0.5, "C": 0.7},
            "lead": {"D": 0.7, "I": 0.6, "S": 0.5, "C": 0.6},
            "principal": {"D": 0.7, "I": 0.5, "S": 0.4, "C": 0.8},
            "executive": {"D": 0.8, "I": 0.7, "S": 0.3, "C": 0.6},
        }
        
        for level, scores in seniority_levels.items():
            if level in job_title:
                return scores
        
        return {"D": 0.5, "I": 0.5, "S": 0.5, "C": 0.5}
    
    def _analyze_email_domain(self, email: str) -> Dict[str, float]:
        """Email domain insights"""
        if not email or "@" not in email:
            return {"D": 0.5, "I": 0.5, "S": 0.5, "C": 0.5}
        
        domain = email.split("@")[1].lower()
        
        # Personal emails vs corporate
        if domain in ["gmail.com", "yahoo.com", "hotmail.com"]:
            return {"D": 0.6, "I": 0.6, "S": 0.4, "C": 0.4}
        elif ".edu" in domain or ".gov" in domain:
            return {"D": 0.4, "I": 0.5, "S": 0.7, "C": 0.8}
        else:
            return {"D": 0.5, "I": 0.4, "S": 0.6, "C": 0.7}
    
    def _calculate_disc_scores(self, factors: Dict[str, Any]) -> Dict[str, float]:
        """Calculate weighted DISC scores from all factors including LinkedIn"""
        # Adjust weights based on LinkedIn availability
        linkedin_factor = factors.get("linkedin_factor")
        if linkedin_factor and linkedin_factor.get("data_source") == "linkedin_analysis":
            weights = {
                "job_title_factor": 0.25,
                "company_culture_factor": 0.15,
                "industry_factor": 0.15,
                "seniority_factor": 0.1,
                "email_domain_factor": 0.05,
                "linkedin_factor": 0.3  # High weight for LinkedIn data
            }
        else:
            weights = {
                "job_title_factor": 0.4,
                "company_culture_factor": 0.2,
                "industry_factor": 0.2,
                "seniority_factor": 0.1,
                "email_domain_factor": 0.1
            }
        
        final_scores = {"D": 0, "I": 0, "S": 0, "C": 0}
        
        for factor_name, weight in weights.items():
            if factor_name == "linkedin_factor" and factors.get("linkedin_factor"):
                # Handle LinkedIn factor specially
                linkedin_data = factors["linkedin_factor"]
                linkedin_scores = linkedin_data.get("disc_scores", {})
                for disc_type in final_scores:
                    if disc_type in linkedin_scores:
                        final_scores[disc_type] += linkedin_scores[disc_type] * weight
            elif factor_name in factors and isinstance(factors[factor_name], dict):
                factor_scores = factors[factor_name]
                for disc_type in final_scores:
                    if disc_type in factor_scores:
                        final_scores[disc_type] += factor_scores[disc_type] * weight
        
        # Add personality seed variation (±10%)
        seed = factors.get("personality_seed", 500)
        for disc_type in final_scores:
            variation = ((seed + ord(disc_type)) % 200 - 100) / 1000  # -0.1 to +0.1
            final_scores[disc_type] = max(0.1, min(0.9, final_scores[disc_type] + variation))
        
        return final_scores
    
    def _determine_primary_disc(self, disc_scores: Dict[str, float]) -> str:
        """Determine primary and secondary DISC types"""
        sorted_scores = sorted(disc_scores.items(), key=lambda x: x[1], reverse=True)
        
        primary = sorted_scores[0][0]
        secondary = sorted_scores[1][0]
        
        # If scores are close, create combination
        if sorted_scores[0][1] - sorted_scores[1][1] < 0.15:
            return f"{primary}{secondary}"
        else:
            return primary
    
    def _generate_personality_traits(self, primary_disc: str, factors: Dict[str, Any]) -> List[str]:
        """Generate realistic personality traits"""
        base_traits = {
            "D": ["results-oriented", "decisive", "confident", "competitive", "direct", "ambitious"],
            "I": ["outgoing", "enthusiastic", "persuasive", "optimistic", "sociable", "inspiring"],
            "S": ["patient", "loyal", "supportive", "reliable", "calm", "team-oriented"],
            "C": ["analytical", "detail-oriented", "systematic", "quality-focused", "precise", "methodical"]
        }
        
        # Get base traits for primary type
        primary_type = primary_disc[0]
        traits = base_traits.get(primary_type, base_traits["D"])[:3]
        
        # Add secondary traits if combination
        if len(primary_disc) > 1:
            secondary_type = primary_disc[1]
            secondary_traits = base_traits.get(secondary_type, [])[:2]
            traits.extend(secondary_traits)
        
        return traits[:5]  # Limit to 5 traits
    
    def _analyze_communication_style(self, primary_disc: str, factors: Dict[str, Any]) -> List[str]:
        """Analyze communication preferences"""
        communication_styles = {
            "D": ["direct", "brief", "results-focused", "decisive"],
            "I": ["enthusiastic", "expressive", "story-telling", "persuasive"],
            "S": ["patient", "supportive", "good listener", "diplomatic"],
            "C": ["detailed", "data-driven", "precise", "methodical"]
        }
        
        primary_type = primary_disc[0]
        styles = communication_styles.get(primary_type, communication_styles["D"])[:3]
        
        return styles
    
    def _generate_sales_approach(self, primary_disc: str, factors: Dict[str, Any]) -> str:
        """Generate sales approach recommendation"""
        approaches = {
            "D": "Results-Oriented Sales - Focus on ROI, efficiency, and quick decisions",
            "I": "Relationship-Based Sales - Build rapport, use stories, and create excitement",
            "S": "Trust-Building Sales - Take time, provide support, and ensure stability",
            "C": "Data-Driven Sales - Provide detailed information, proof, and systematic approach"
        }
        
        primary_type = primary_disc[0]
        return approaches.get(primary_type, approaches["D"])
    
    def _calculate_confidence_score(self, factors: Dict[str, Any]) -> float:
        """Calculate analysis confidence based on available data"""
        base_confidence = 0.75
        
        # LinkedIn data significantly boosts confidence
        linkedin_factor = factors.get("linkedin_factor")
        if linkedin_factor and linkedin_factor.get("data_source") == "linkedin_analysis":
            base_confidence += 0.15
        
        # Boost confidence based on data quality
        if factors.get("job_title_factor"):
            base_confidence += 0.05
        if factors.get("industry_factor"):
            base_confidence += 0.03
        if factors.get("company_culture_factor"):
            base_confidence += 0.02
        
        return min(0.95, base_confidence)

# Global instance
enhanced_personality_service = EnhancedPersonalityService() 