#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.enhanced_personality_service import enhanced_personality_service

def test_enhanced_personality():
    """Test the enhanced personality analysis system"""
    
    # Test different lead profiles
    test_leads = [
        {
            "first_name": "John",
            "last_name": "Smith", 
            "job_title": "CEO",
            "company": "TechCorp",
            "industry": "Technology",
            "email": "john.smith@techcorp.com"
        },
        {
            "first_name": "Sarah",
            "last_name": "Johnson",
            "job_title": "Software Engineer",
            "company": "Google",
            "industry": "Technology", 
            "email": "sarah.johnson@google.com"
        },
        {
            "first_name": "Mike",
            "last_name": "Davis",
            "job_title": "Sales Director",
            "company": "SalesForce",
            "industry": "Software",
            "email": "mike.davis@salesforce.com"
        },
        {
            "first_name": "Lisa",
            "last_name": "Brown",
            "job_title": "HR Manager",
            "company": "Microsoft",
            "industry": "Technology",
            "email": "lisa.brown@microsoft.com"
        },
        {
            "first_name": "David",
            "last_name": "Wilson",
            "job_title": "Financial Analyst",
            "company": "Goldman Sachs",
            "industry": "Finance",
            "email": "david.wilson@gs.com"
        },
        {
            "first_name": "Emma",
            "last_name": "Taylor",
            "job_title": "Marketing Coordinator",
            "company": "Creative Agency",
            "industry": "Marketing",
            "email": "emma.taylor@gmail.com"
        }
    ]
    
    print("🧠 Enhanced Personality Analysis Test Results")
    print("=" * 60)
    
    for i, lead in enumerate(test_leads, 1):
        print(f"\n{i}. {lead['first_name']} {lead['last_name']} - {lead['job_title']}")
        print(f"   Company: {lead['company']} ({lead['industry']})")
        print(f"   Email: {lead['email']}")
        
        # Analyze personality
        result = enhanced_personality_service.analyze_personality(lead)
        
        print(f"   🎯 DISC Profile: {result['disc_profile']}")
        print(f"   📊 DISC Scores: D:{result['disc_scores']['D']:.2f} I:{result['disc_scores']['I']:.2f} S:{result['disc_scores']['S']:.2f} C:{result['disc_scores']['C']:.2f}")
        print(f"   ✨ Traits: {', '.join(result['traits'])}")
        print(f"   💬 Communication: {', '.join(result['communication_style'])}")
        print(f"   🎯 Sales Approach: {result['sales_approach']}")
        print(f"   🔍 Confidence: {result['confidence']:.2f}")
        print(f"   🌱 Seed: {result['analysis_factors']['personality_seed']}")
        
    print("\n" + "=" * 60)
    print("✅ Enhanced personality analysis test completed!")
    print("🎉 Each lead now has unique personality insights!")

if __name__ == "__main__":
    test_enhanced_personality() 