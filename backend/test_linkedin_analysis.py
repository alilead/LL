#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.enhanced_personality_service import enhanced_personality_service

def test_linkedin_enhanced_analysis():
    """Test LinkedIn-enhanced personality analysis"""
    
    # Test leads with LinkedIn URLs
    test_leads = [
        {
            "first_name": "Elon",
            "last_name": "Musk", 
            "job_title": "CEO",
            "company": "Tesla",
            "industry": "Technology",
            "email": "elon@tesla.com",
            "linkedin_url": "https://linkedin.com/in/elonmusk"
        },
        {
            "first_name": "Satya",
            "last_name": "Nadella",
            "job_title": "CEO",
            "company": "Microsoft",
            "industry": "Technology", 
            "email": "satya@microsoft.com",
            "linkedin_url": "https://linkedin.com/in/satyanadella"
        },
        {
            "first_name": "Jane",
            "last_name": "Smith",
            "job_title": "Software Engineer",
            "company": "Startup Inc",
            "industry": "Technology",
            "email": "jane@startup.com",
            "linkedin_url": "https://linkedin.com/in/janesmith"
        },
        {
            "first_name": "Bob",
            "last_name": "Johnson",
            "job_title": "Sales Manager",
            "company": "SalesForce",
            "industry": "Software",
            "email": "bob@salesforce.com"
            # No LinkedIn URL - should use standard analysis
        }
    ]
    
    print("🔗 LinkedIn-Enhanced Personality Analysis Test")
    print("=" * 60)
    
    for i, lead in enumerate(test_leads, 1):
        print(f"\n{i}. {lead['first_name']} {lead['last_name']} - {lead['job_title']}")
        print(f"   Company: {lead['company']} ({lead['industry']})")
        print(f"   LinkedIn: {lead.get('linkedin_url', 'Not provided')}")
        
        # Analyze personality with LinkedIn enhancement
        result = enhanced_personality_service.analyze_personality(lead)
        
        print(f"   🎯 DISC Profile: {result['disc_profile']}")
        print(f"   📊 DISC Scores: D:{result['disc_scores']['D']:.2f} I:{result['disc_scores']['I']:.2f} S:{result['disc_scores']['S']:.2f} C:{result['disc_scores']['C']:.2f}")
        print(f"   ✨ Traits: {', '.join(result['traits'])}")
        print(f"   💬 Communication: {', '.join(result['communication_style'])}")
        print(f"   🔍 Confidence: {result['confidence']:.2f}")
        
        # Show LinkedIn-specific insights if available
        linkedin_factor = result['analysis_factors'].get('linkedin_factor')
        if linkedin_factor and linkedin_factor.get('data_source') == 'linkedin_analysis':
            print(f"   🔗 LinkedIn Leadership: {linkedin_factor.get('leadership_style', 'Unknown')}")
            print(f"   📈 LinkedIn Traits: {', '.join(linkedin_factor.get('personality_traits', []))}")
            print(f"   🌐 Data Source: LinkedIn Enhanced")
        else:
            print(f"   🌐 Data Source: Standard Analysis")
        
        print(f"   🌱 Seed: {result['analysis_factors']['personality_seed']}")
        
    print("\n" + "=" * 60)
    print("✅ LinkedIn-enhanced personality analysis test completed!")
    print("🎉 LinkedIn profiles provide richer personality insights!")

if __name__ == "__main__":
    test_linkedin_enhanced_analysis() 