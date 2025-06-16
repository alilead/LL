from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

app = FastAPI(title="LeadLab Test Server")

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock lead data for testing
class MockLead:
    def __init__(self, id):
        self.id = id
        self.first_name = "John"
        self.last_name = "Doe"
        self.email = "john.doe@example.com"
        self.job_title = "Software Engineer"
        self.company = "Tech Corp"
        self.industry = "Technology"
        self.linkedin = "https://linkedin.com/in/johndoe"
        self.phone = "+1234567890"
        self.notes = "Test lead for psychometric analysis"

@app.post("/api/v1/auth/login")
async def login():
    """Mock login endpoint"""
    return {
        "access_token": "mock-token-12345",
        "token_type": "bearer",
        "user": {
            "id": 1,
            "email": "test@example.com",
            "is_active": True
        }
    }

@app.get("/api/v1/auth/me")
async def get_current_user():
    """Mock current user endpoint"""
    return {
        "id": 1,
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "is_active": True,
        "is_admin": False
    }

@app.get("/api/v1/leads/")
async def get_leads():
    """Mock leads list"""
    return {
        "items": [
            {
                "id": 17500,
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "job_title": "Software Engineer",
                "company": "Tech Corp",
                "industry": "Technology",
                "created_at": "2025-06-16T13:00:00",
                "updated_at": "2025-06-16T13:00:00"
            },
            {
                "id": 17501,
                "first_name": "Jane",
                "last_name": "Smith",
                "email": "jane.smith@example.com",
                "job_title": "Marketing Manager",
                "company": "Marketing Inc",
                "industry": "Marketing",
                "created_at": "2025-06-16T13:00:00",
                "updated_at": "2025-06-16T13:00:00"
            }
        ],
        "total": 2
    }

@app.get("/api/v1/leads/{lead_id}")
async def get_lead(lead_id: int):
    """Mock single lead"""
    return {
        "id": lead_id,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "job_title": "Software Engineer",
        "company": "Tech Corp",
        "industry": "Technology",
        "linkedin": "https://linkedin.com/in/johndoe",
        "phone": "+1234567890",
        "notes": "Test lead for psychometric analysis",
        "created_at": "2025-06-16T13:00:00",
        "updated_at": "2025-06-16T13:00:00"
    }

@app.get("/api/v1/notifications")
async def get_notifications():
    """Mock notifications"""
    return {"items": [], "total": 0}

@app.get("/api/v1/tags")
async def get_tags():
    """Mock tags"""
    return {"items": [], "total": 0}

@app.get("/api/v1/deals")
async def get_deals():
    """Mock deals"""
    return {"items": [], "total": 0}

@app.get("/api/v1/dashboard/stats")
async def get_dashboard_stats():
    """Mock dashboard stats"""
    return {
        "total_leads": 2,
        "total_deals": 0,
        "conversion_rate": 0,
        "revenue": 0
    }

@app.get("/api/v1/credits/balance")
async def get_credits():
    """Mock credits balance"""
    return {"balance": 100, "usage": 0}

@app.get("/api/v1/leads/stats")
async def get_leads_stats():
    """Mock leads stats"""
    return {
        "total": 2,
        "new_this_month": 2,
        "conversion_rate": 0
    }

@app.get("/api/v1/ai-insights/{lead_id}/psychometric")
async def get_psychometric_analysis(lead_id: int, use_crystal: bool = False, refresh: bool = False):
    """
    Test endpoint for psychometric analysis
    """
    try:
        # Create mock lead
        lead = MockLead(lead_id)
        
        # Simple inline analyzer for testing
        psychometric_data = {
            "combined_insights": {
                "personality_type": "C",
                "confidence_score": 85,
                "data_completeness": {
                    "job_title": True,
                    "industry": True,
                    "company": True,
                    "linkedin": True,
                    "email": True
                }
            },
            "disc_analysis": {
                "D": 27.1,
                "I": 12.5,
                "S": 20.8,
                "C": 39.6,
                "primary_type": "C",
                "secondary_type": "D",
                "interpretation": "Analytical and detail-oriented professional who values precision and systematic approaches"
            },
            "big_five": {
                "openness": 75,
                "conscientiousness": 85,
                "extraversion": 45,
                "agreeableness": 60,
                "neuroticism": 40,
                "profile_summary": "Highly conscientious and open to experience, moderately agreeable, balanced on extraversion"
            },
            "sales_intelligence": {
                "recommended_approach": "Data-driven, systematic presentation with detailed supporting evidence",
                "meeting_duration": "90-120 minutes",
                "communication_style": "Professional, detailed, fact-based",
                "decision_making": "Thorough analysis required, prefers written follow-ups",
                "key_motivators": ["Quality", "Accuracy", "Efficiency", "Proven results"],
                "stress_triggers": ["Rushed decisions", "Incomplete information", "Disorganization"],
                "ideal_meeting_time": "Mid-morning (9-11 AM) or early afternoon (1-3 PM)"
            },
            "behavioral_predictions": {
                "email_response_style": "Detailed, professional, may request additional information",
                "negotiation_approach": "Methodical, fact-based, seeks win-win solutions",
                "follow_up_preferences": "Written summaries, clear action items, timelines",
                "objection_handling": "Address with data, case studies, and logical reasoning"
            }
        }
        
        return {
            "success": True,
            "data": psychometric_data,
            "message": "Psychometric analysis completed successfully using internal AI system"
        }
        
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "message": f"Failed to analyze lead psychometrics: {str(e)}"
        }

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Server is running"}

@app.get("/")
async def root():
    return {"message": "LeadLab Test API - Psychometric Analysis Ready!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 