from typing import Dict, Any, List, Tuple
import numpy as np
from datetime import datetime

class SalesAnalyzer:
    """Analyzes psychometric data to generate sales insights and opportunities"""

    DISC_OPPORTUNITY_WEIGHTS = {
        'D': {'cold_call': 0.7, 'email': 0.5, 'social': 0.3, 'referral': 0.8},
        'I': {'cold_call': 0.5, 'email': 0.3, 'social': 0.9, 'referral': 0.7},
        'S': {'cold_call': 0.3, 'email': 0.7, 'social': 0.5, 'referral': 0.9},
        'C': {'cold_call': 0.2, 'email': 0.9, 'social': 0.4, 'referral': 0.6}
    }

    BEHAVIORAL_TRAIT_WEIGHTS = {
        'Dominance': 0.15,
        'Expressiveness': 0.1,
        'Leniency': 0.1,
        'Pace': 0.1,
        'Pragmatism': 0.15,
        'Risk-Aversion': 0.15,
        'Skepticism': 0.15,
        'Social': 0.1
    }

    def analyze_sales_opportunity(self, psychometric_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate sales opportunity score and recommendations"""
        
        personality = psychometric_data.get("personality_data", {})
        disc_type = personality.get("disc_type", "")
        behavioral_traits = personality.get("behavioral_traits", {})
        
        # Calculate base opportunity score from DISC type
        disc_scores = personality.get("disc_scores", {})
        base_score = self._calculate_disc_base_score(disc_scores)
        
        # Adjust score based on behavioral traits
        trait_score = self._calculate_trait_score(behavioral_traits)
        
        # Calculate final opportunity score (0-100)
        final_score = min(100, max(0, (base_score + trait_score) / 2))
        
        # Determine opportunity level
        opportunity_level = self._get_opportunity_level(final_score)
        
        # Generate approach recommendations
        approach_scores = self._calculate_approach_scores(disc_type, behavioral_traits)
        
        return {
            "opportunity_score": round(final_score, 2),
            "opportunity_level": opportunity_level,
            "confidence": self._calculate_confidence(behavioral_traits),
            "best_approaches": self._get_best_approaches(approach_scores),
            "sales_stages": self._generate_sales_stages(psychometric_data),
            "success_probability": self._calculate_success_probability(final_score, behavioral_traits),
            "risk_factors": self._identify_risk_factors(psychometric_data),
            "estimated_sales_cycle": self._estimate_sales_cycle(behavioral_traits),
            "decision_making_style": self._analyze_decision_making(psychometric_data)
        }

    def _calculate_disc_base_score(self, disc_scores: Dict[str, float]) -> float:
        """Calculate base opportunity score from DISC scores"""
        if not disc_scores:
            return 50.0
        
        # Weighted average of DISC scores
        weights = {'D': 0.3, 'I': 0.25, 'S': 0.2, 'C': 0.25}
        score = 0
        for disc_type, weight in weights.items():
            score += disc_scores.get(disc_type.lower(), 0) * weight
        
        return score

    def _calculate_trait_score(self, traits: Dict[str, float]) -> float:
        """Calculate score adjustment based on behavioral traits"""
        if not traits:
            return 50.0
        
        score = 0
        total_weight = 0
        
        for trait, value in traits.items():
            if trait in self.BEHAVIORAL_TRAIT_WEIGHTS:
                weight = self.BEHAVIORAL_TRAIT_WEIGHTS[trait]
                score += value * weight
                total_weight += weight
        
        return score / total_weight if total_weight > 0 else 50.0

    def _get_opportunity_level(self, score: float) -> str:
        """Determine opportunity level based on score"""
        if score >= 80:
            return "VERY_HIGH"
        elif score >= 65:
            return "HIGH"
        elif score >= 45:
            return "MODERATE"
        elif score >= 30:
            return "LOW"
        else:
            return "VERY_LOW"

    def _calculate_approach_scores(self, disc_type: str, traits: Dict[str, float]) -> Dict[str, float]:
        """Calculate effectiveness scores for different sales approaches"""
        base_scores = self.DISC_OPPORTUNITY_WEIGHTS.get(disc_type, {})
        
        # Adjust based on behavioral traits
        adjusted_scores = {}
        for approach, base_score in base_scores.items():
            score = base_score
            
            # Adjust for specific traits
            if 'Social' in traits:
                if approach in ['social', 'referral']:
                    score *= (1 + traits['Social'] / 100)
            if 'Risk-Aversion' in traits:
                if approach == 'cold_call':
                    score *= (1 - traits['Risk-Aversion'] / 200)
            
            adjusted_scores[approach] = min(1.0, max(0.0, score))
        
        return adjusted_scores

    def _get_best_approaches(self, approach_scores: Dict[str, float]) -> List[Dict[str, Any]]:
        """Get sorted list of best approaches with scores"""
        approaches = [
            {"method": k, "score": v, "confidence": self._calculate_approach_confidence(k, v)}
            for k, v in approach_scores.items()
        ]
        return sorted(approaches, key=lambda x: x["score"], reverse=True)

    def _generate_sales_stages(self, psychometric_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate customized sales stages based on psychometric profile"""
        personality = psychometric_data.get("personality_data", {})
        traits = personality.get("behavioral_traits", {})
        
        stages = []
        
        # Initial Contact Stage
        communication = psychometric_data.get("communication_style", {})
        stages.append({
            "stage": "Initial Contact",
            "recommended_actions": communication.get("recommendations", []),
            "estimated_duration": "1-2 days",
            "success_factors": communication.get("building_trust", [])
        })
        
        # Discovery Stage
        sales_insights = psychometric_data.get("sales_insights", {})
        stages.append({
            "stage": "Discovery",
            "recommended_actions": sales_insights.get("selling", []),
            "estimated_duration": "3-5 days",
            "key_questions": self._generate_discovery_questions(traits)
        })
        
        # Solution Presentation
        stages.append({
            "stage": "Solution Presentation",
            "recommended_actions": sales_insights.get("product_demo", []),
            "estimated_duration": "1-2 weeks",
            "presentation_tips": sales_insights.get("first_impressions", [])
        })
        
        # Negotiation
        stages.append({
            "stage": "Negotiation",
            "recommended_actions": sales_insights.get("negotiating", []),
            "estimated_duration": "1-3 weeks",
            "pricing_strategy": sales_insights.get("pricing", [])
        })
        
        # Decision & Closing
        stages.append({
            "stage": "Closing",
            "recommended_actions": psychometric_data.get("motivation_factors", {}).get("drivers", []),
            "estimated_duration": "1-2 weeks",
            "closing_strategy": self._generate_closing_strategy(traits)
        })
        
        return stages

    def _calculate_confidence(self, traits: Dict[str, float]) -> float:
        """Calculate confidence level in the analysis"""
        if not traits:
            return 0.6  # Default moderate confidence
            
        # Weight different factors
        confidence = 0.7  # Base confidence
        
        # Adjust based on trait clarity
        trait_strength = sum(abs(v - 50) for v in traits.values()) / len(traits)
        confidence += (trait_strength / 100) * 0.3
        
        return min(1.0, max(0.0, confidence))

    def _calculate_success_probability(self, opportunity_score: float, traits: Dict[str, float]) -> Dict[str, Any]:
        """Calculate detailed success probability"""
        base_probability = opportunity_score / 100
        
        # Adjust for key traits
        if traits.get('Risk-Aversion', 50) > 70:
            base_probability *= 0.9
        if traits.get('Pragmatism', 50) > 70:
            base_probability *= 1.1
            
        return {
            "overall_probability": round(base_probability * 100, 2),
            "factors": {
                "short_term": round(base_probability * 90, 2),
                "medium_term": round(base_probability * 100, 2),
                "long_term": round(base_probability * 110, 2)
            },
            "confidence_level": round(self._calculate_confidence(traits) * 100, 2)
        }

    def _identify_risk_factors(self, psychometric_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify potential risk factors in the sales process"""
        risks = []
        personality = psychometric_data.get("personality_data", {})
        traits = personality.get("behavioral_traits", {})
        
        if traits.get('Risk-Aversion', 0) > 70:
            risks.append({
                "factor": "High Risk Aversion",
                "impact": "HIGH",
                "mitigation": "Provide detailed documentation and case studies"
            })
            
        if traits.get('Skepticism', 0) > 70:
            risks.append({
                "factor": "High Skepticism",
                "impact": "MEDIUM",
                "mitigation": "Focus on data-driven proof points"
            })
            
        # Add personality-specific risks
        blindspots = psychometric_data.get("teamwork_preferences", {}).get("blindspots", [])
        for blindspot in blindspots:
            risks.append({
                "factor": blindspot,
                "impact": "MEDIUM",
                "mitigation": "Address proactively in communication"
            })
            
        return risks

    def _estimate_sales_cycle(self, traits: Dict[str, float]) -> Dict[str, Any]:
        """Estimate likely sales cycle length based on behavioral traits"""
        base_cycle = 30  # Base 30 days
        
        # Adjust based on traits
        if traits.get('Pace', 50) < 30:
            base_cycle *= 1.3
        elif traits.get('Pace', 50) > 70:
            base_cycle *= 0.8
            
        if traits.get('Risk-Aversion', 50) > 70:
            base_cycle *= 1.2
            
        return {
            "estimated_days": round(base_cycle),
            "range": {
                "minimum": round(base_cycle * 0.8),
                "maximum": round(base_cycle * 1.2)
            },
            "confidence_level": round(self._calculate_confidence(traits) * 100, 2)
        }

    def _analyze_decision_making(self, psychometric_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze decision-making style and preferences"""
        personality = psychometric_data.get("personality_data", {})
        traits = personality.get("behavioral_traits", {})
        
        style = "ANALYTICAL" if traits.get('Pragmatism', 50) > 70 else \
               "EMOTIONAL" if traits.get('Social', 50) > 70 else \
               "BALANCED"
               
        return {
            "style": style,
            "key_drivers": psychometric_data.get("motivation_factors", {}).get("drivers", []),
            "preferred_communication": psychometric_data.get("communication_style", {}).get("recommendations", []),
            "decision_speed": "SLOW" if traits.get('Risk-Aversion', 50) > 70 else "FAST",
            "influencing_factors": psychometric_data.get("motivation_factors", {}).get("strengths", [])
        }

    def _generate_discovery_questions(self, traits: Dict[str, float]) -> List[str]:
        """Generate personalized discovery questions based on traits"""
        questions = []
        
        if traits.get('Pragmatism', 50) > 70:
            questions.extend([
                "What specific metrics are you looking to improve?",
                "How do you currently measure success in this area?"
            ])
            
        if traits.get('Risk-Aversion', 50) > 70:
            questions.extend([
                "What potential risks concern you the most?",
                "What would make you feel confident about this decision?"
            ])
            
        return questions

    def _generate_closing_strategy(self, traits: Dict[str, float]) -> List[str]:
        """Generate personalized closing strategy based on traits"""
        strategies = []
        
        if traits.get('Pragmatism', 50) > 70:
            strategies.append("Focus on ROI and concrete benefits")
        
        if traits.get('Risk-Aversion', 50) > 70:
            strategies.append("Emphasize guarantees and risk mitigation")
            
        if traits.get('Social', 50) > 70:
            strategies.append("Build personal connection and trust")
            
        return strategies
