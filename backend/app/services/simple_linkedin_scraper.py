import requests
import re
import logging
from typing import Dict, List, Any, Optional
import time
import random

logger = logging.getLogger(__name__)

class SimpleLinkedInScraper:
    """
    Simple LinkedIn profile scraper using regex (no BeautifulSoup dependency)
    WARNING: Use responsibly and respect LinkedIn's ToS
    """
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })
    
    def scrape_linkedin_profile(self, linkedin_url: str) -> Dict[str, Any]:
        """
        Scrape public LinkedIn profile data using regex
        """
        try:
            # Add random delay to avoid rate limiting
            time.sleep(random.uniform(1, 3))
            
            # Clean URL
            clean_url = self._clean_linkedin_url(linkedin_url)
            
            # Make request
            response = self.session.get(clean_url, timeout=10)
            
            if response.status_code == 200:
                return self._parse_profile_html(response.text, clean_url)
            else:
                logger.warning(f"LinkedIn request failed: {response.status_code}")
                return self._empty_profile()
                
        except Exception as e:
            logger.error(f"LinkedIn scraping error: {str(e)}")
            return self._empty_profile()
    
    def _clean_linkedin_url(self, url: str) -> str:
        """
        Clean and normalize LinkedIn URL
        """
        # Remove tracking parameters
        url = re.sub(r'\?.*$', '', url)
        
        # Ensure proper format
        if not url.startswith('http'):
            url = 'https://' + url
        
        # Add /in/ if missing
        if 'linkedin.com' in url and '/in/' not in url:
            url = url.replace('linkedin.com', 'linkedin.com/in')
        
        return url
    
    def _parse_profile_html(self, html: str, url: str) -> Dict[str, Any]:
        """
        Parse LinkedIn profile HTML using regex
        """
        try:
            # Extract basic information using regex
            profile_data = {
                "url": url,
                "name": self._extract_name_regex(html),
                "headline": self._extract_headline_regex(html),
                "location": self._extract_location_regex(html),
                "summary": self._extract_summary_regex(html),
                "experience": self._extract_experience_regex(html),
                "education": self._extract_education_regex(html),
                "skills": self._extract_skills_regex(html),
                "connections": self._extract_connections_regex(html),
                "profile_completeness": 0.8
            }
            
            return profile_data
            
        except Exception as e:
            logger.error(f"HTML parsing error: {str(e)}")
            return self._empty_profile()
    
    def _extract_name_regex(self, html: str) -> str:
        """Extract name using regex"""
        try:
            # Try multiple patterns for name
            patterns = [
                r'<h1[^>]*class="[^"]*text-heading-xlarge[^"]*"[^>]*>([^<]+)</h1>',
                r'<h1[^>]*>([^<]+)</h1>',
                r'"name":"([^"]+)"',
                r'<title>([^|]+)\|'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    name = match.group(1).strip()
                    if len(name) > 2 and not any(word in name.lower() for word in ['linkedin', 'profile']):
                        return name
            
            return "Unknown"
        except:
            return "Unknown"
    
    def _extract_headline_regex(self, html: str) -> str:
        """Extract headline using regex"""
        try:
            patterns = [
                r'"headline":"([^"]+)"',
                r'<div[^>]*class="[^"]*text-body-medium[^"]*"[^>]*>([^<]+)</div>',
                r'<p[^>]*class="[^"]*headline[^"]*"[^>]*>([^<]+)</p>'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    headline = match.group(1).strip()
                    if len(headline) > 10:
                        return headline
            
            return "Professional"
        except:
            return "Professional"
    
    def _extract_location_regex(self, html: str) -> str:
        """Extract location using regex"""
        try:
            patterns = [
                r'"geoLocationName":"([^"]+)"',
                r'"location":"([^"]+)"',
                r'<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)</span>'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    location = match.group(1).strip()
                    if len(location) > 2:
                        return location
            
            return "Unknown"
        except:
            return "Unknown"
    
    def _extract_summary_regex(self, html: str) -> str:
        """Extract summary using regex"""
        try:
            patterns = [
                r'"summary":"([^"]+)"',
                r'<div[^>]*class="[^"]*about[^"]*"[^>]*>.*?<p[^>]*>([^<]+)</p>',
                r'<section[^>]*class="[^"]*about[^"]*"[^>]*>.*?<div[^>]*>([^<]+)</div>'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
                if match:
                    summary = match.group(1).strip()
                    if len(summary) > 50:
                        return summary[:500]
            
            return "No summary available"
        except:
            return "No summary available"
    
    def _extract_experience_regex(self, html: str) -> List[Dict[str, str]]:
        """Extract experience using regex"""
        try:
            experience = []
            
            # Look for experience patterns
            exp_pattern = r'"title":"([^"]+)"[^}]*"companyName":"([^"]+)"'
            matches = re.findall(exp_pattern, html, re.IGNORECASE)
            
            for title, company in matches[:3]:  # Limit to top 3
                if title and company:
                    experience.append({
                        "title": title.strip(),
                        "company": company.strip(),
                        "duration": "Unknown"
                    })
            
            return experience if experience else [{"title": "Professional", "company": "Unknown", "duration": "Unknown"}]
        except:
            return [{"title": "Professional", "company": "Unknown", "duration": "Unknown"}]
    
    def _extract_education_regex(self, html: str) -> List[Dict[str, str]]:
        """Extract education using regex"""
        try:
            education = []
            
            # Look for education patterns
            edu_pattern = r'"schoolName":"([^"]+)"[^}]*"degreeName":"([^"]*)"'
            matches = re.findall(edu_pattern, html, re.IGNORECASE)
            
            for school, degree in matches[:2]:  # Limit to top 2
                if school:
                    education.append({
                        "school": school.strip(),
                        "degree": degree.strip() if degree else "Unknown"
                    })
            
            return education if education else [{"school": "University", "degree": "Degree"}]
        except:
            return [{"school": "University", "degree": "Degree"}]
    
    def _extract_skills_regex(self, html: str) -> List[str]:
        """Extract skills using regex"""
        try:
            skills = []
            
            # Look for skills patterns
            skill_patterns = [
                r'"name":"([^"]+)"[^}]*"skillDisplayName"',
                r'"skillName":"([^"]+)"',
                r'<span[^>]*class="[^"]*skill[^"]*"[^>]*>([^<]+)</span>'
            ]
            
            for pattern in skill_patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                for skill in matches[:10]:  # Limit to 10 skills
                    if skill and len(skill) > 2:
                        skills.append(skill.strip())
            
            # Remove duplicates
            skills = list(dict.fromkeys(skills))
            
            return skills[:10] if skills else ["Communication", "Leadership", "Problem Solving"]
        except:
            return ["Communication", "Leadership", "Problem Solving"]
    
    def _extract_connections_regex(self, html: str) -> int:
        """Extract connection count using regex"""
        try:
            patterns = [
                r'"connectionsCount":(\d+)',
                r'(\d+)\+?\s*connections?',
                r'(\d+)\+?\s*followers?'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    return int(match.group(1))
            
            return 500  # Default assumption
        except:
            return 500
    
    def _empty_profile(self) -> Dict[str, Any]:
        """Return empty profile structure"""
        return {
            "url": "",
            "name": "Unknown",
            "headline": "Professional",
            "location": "Unknown",
            "summary": "No data available",
            "experience": [{"title": "Professional", "company": "Unknown", "duration": "Unknown"}],
            "education": [{"school": "University", "degree": "Degree"}],
            "skills": ["Communication", "Leadership"],
            "connections": 500,
            "profile_completeness": 0.3
        }

# Global instance
simple_linkedin_scraper = SimpleLinkedInScraper() 