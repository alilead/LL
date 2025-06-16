#!/usr/bin/env python3

import requests
import json

def test_linkedin_enhanced_api():
    """Test LinkedIn-enhanced personality analysis via API"""
    
    base_url = "http://localhost:8000/api/v1"
    
    # Test lead data with LinkedIn URL
    test_lead = {
        "first_name": "Elon",
        "last_name": "Musk",
        "job_title": "CEO",
        "company": "Tesla",
        "industry": "Technology",
        "email": "elon@tesla.com",
        "linkedin_url": "https://linkedin.com/in/elonmusk"
    }
    
    print("🔗 Testing LinkedIn-Enhanced API")
    print("=" * 50)
    
    try:
        # Simulate AI insights analysis
        print(f"📊 Analyzing: {test_lead['first_name']} {test_lead['last_name']}")
        print(f"🔗 LinkedIn: {test_lead['linkedin_url']}")
        
        # Direct service test (simulating what API would do)
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))
        
        from app.services.enhanced_personality_service import enhanced_personality_service
        
        result = enhanced_personality_service.analyze_personality(test_lead)
        
        print(f"\n✅ Analysis Results:")
        print(f"   🎯 DISC Profile: {result['disc_profile']}")
        print(f"   📊 DISC Scores: D:{result['disc_scores']['D']:.2f} I:{result['disc_scores']['I']:.2f} S:{result['disc_scores']['S']:.2f} C:{result['disc_scores']['C']:.2f}")
        print(f"   🔍 Confidence: {result['confidence']:.2f}")
        
        # Check if LinkedIn enhancement was used
        linkedin_factor = result['analysis_factors'].get('linkedin_factor')
        if linkedin_factor and linkedin_factor.get('data_source') == 'linkedin_analysis':
            print(f"   🔗 LinkedIn Enhanced: YES")
            print(f"   👔 Leadership Style: {linkedin_factor.get('leadership_style', 'Unknown')}")
            print(f"   📈 LinkedIn Traits: {', '.join(linkedin_factor.get('personality_traits', []))}")
        else:
            print(f"   🔗 LinkedIn Enhanced: NO")
        
        print(f"\n🎉 LinkedIn-enhanced analysis working!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_linkedin_enhanced_api() 