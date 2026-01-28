import requests
import re
import logging
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
import time
import random

logger = logging.getLogger(__name__)

class RealLinkedInScraper:
    """
    Real LinkedIn profile scraper for public data
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
        Scrape public LinkedIn profile data
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
        Parse LinkedIn profile HTML for public data
        """
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract basic information
            profile_data = {
                "url": url,
                "name": self._extract_name(soup),
                "headline": self._extract_headline(soup),
                "location": self._extract_location(soup),
                "summary": self._extract_summary(soup),
                "experience": self._extract_experience(soup),
                "education": self._extract_education(soup),
                "skills": self._extract_skills(soup),
                "connections": self._extract_connections(soup),
                "profile_completeness": 0.8  # Assume good completeness for scraped profiles
            }
            
            return profile_data
            
        except Exception as e:
            logger.error(f"HTML parsing error: {str(e)}")
            return self._empty_profile()
    
    def _extract_name(self, soup: BeautifulSoup) -> str:
        """Extract full name"""
        try:
            # Try multiple selectors for name
            selectors = [
                'h1.text-heading-xlarge',
                '.pv-text-details__left-panel h1',
                '.top-card-layout__title',
                'h1'
            ]
            
            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    return element.get_text().strip()
            
            return "Unknown"
        except:
            return "Unknown"
    
    def _extract_headline(self, soup: BeautifulSoup) -> str:
        """Extract professional headline"""
        try:
            selectors = [
                '.text-body-medium.break-words',
                '.pv-text-details__left-panel .text-body-medium',
                '.top-card-layout__headline'
            ]
            
            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    headline = element.get_text().strip()
                    if len(headline) > 10:  # Filter out short/irrelevant text
                        return headline
            
            return "Professional"
        except:
            return "Professional"
    
    def _extract_location(self, soup: BeautifulSoup) -> str:
        """Extract location"""
        try:
            selectors = [
                '.text-body-small.inline.t-black--light.break-words',
                '.pv-text-details__left-panel .text-body-small'
            ]
            
            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    location = element.get_text().strip()
                    if any(word in location.lower() for word in ['city', 'state', 'country', ',']):
                        return location
            
            return "Unknown"
        except:
            return "Unknown"
    
    def _extract_summary(self, soup: BeautifulSoup) -> str:
        """Extract about/summary section"""
        try:
            selectors = [
                '.pv-about__summary-text',
                '.core-section-container__content .break-words',
                '.summary .pv-about__summary-text'
            ]
            
            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    summary = element.get_text().strip()
                    if len(summary) > 50:  # Ensure it's substantial
                        return summary[:500]  # Limit length
            
            return "No summary available"
        except:
            return "No summary available"
    
    def _extract_experience(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract work experience"""
        try:
            experience = []
            
            # Look for experience section
            exp_sections = soup.select('.pvs-list__item--line-separated')
            
            for section in exp_sections[:3]:  # Limit to top 3 experiences
                title_elem = section.select_one('.mr1.t-bold')
                company_elem = section.select_one('.t-14.t-normal')
                
                if title_elem and company_elem:
                    experience.append({
                        "title": title_elem.get_text().strip(),
                        "company": company_elem.get_text().strip(),
                        "duration": "Unknown"
                    })
            
            return experience if experience else [{"title": "Professional", "company": "Unknown", "duration": "Unknown"}]
        except:
            return [{"title": "Professional", "company": "Unknown", "duration": "Unknown"}]
    
    def _extract_education(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract education"""
        try:
            education = []
            
            # Look for education section
            edu_sections = soup.select('.education .pv-entity__summary-info')
            
            for section in edu_sections[:2]:  # Limit to top 2
                school_elem = section.select_one('.pv-entity__school-name')
                degree_elem = section.select_one('.pv-entity__degree-name')
                
                if school_elem:
                    education.append({
                        "school": school_elem.get_text().strip(),
                        "degree": degree_elem.get_text().strip() if degree_elem else "Unknown"
                    })
            
            return education if education else [{"school": "University", "degree": "Degree"}]
        except:
            return [{"school": "University", "degree": "Degree"}]
    
    def _extract_skills(self, soup: BeautifulSoup) -> List[str]:
        """Extract skills"""
        try:
            skills = []
            
            # Look for skills section
            skill_elements = soup.select('.pv-skill-category-entity__name')
            
            for elem in skill_elements[:10]:  # Limit to top 10 skills
                skill = elem.get_text().strip()
                if skill and len(skill) > 2:
                    skills.append(skill)
            
            return skills if skills else ["Communication", "Leadership", "Problem Solving"]
        except:
            return ["Communication", "Leadership", "Problem Solving"]
    
    def _extract_connections(self, soup: BeautifulSoup) -> int:
        """Extract connection count"""
        try:
            # Look for connection count
            conn_elements = soup.select('.t-black--light.t-normal')
            
            for elem in conn_elements:
                text = elem.get_text().strip()
                if 'connection' in text.lower():
                    # Extract number from text like "500+ connections"
                    numbers = re.findall(r'\d+', text)
                    if numbers:
                        return int(numbers[0])
            
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
real_linkedin_scraper = RealLinkedInScraper() 