#!/usr/bin/env python3
import os
import sys

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings
import stripe

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Database connection
engine = create_engine(settings.DATABASE_URL)

def check_packages():
    """Check current credit packages"""
    print("=== Current Credit Packages ===")
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT id, name, credits, price, stripe_price_id FROM credit_packages ORDER BY price")
        ).fetchall()
        
        for row in result:
            print(f"ID: {row[0]} | Name: {row[1]} | Credits: {row[2]} | Price: ${row[3]} | Stripe ID: {row[4]}")
    
    return result

def create_stripe_prices():
    """Create Stripe prices for credit packages"""
    print("\n=== Creating Stripe Prices ===")
    
    packages = [
        {"name": "Starter", "credits": 1000, "price": 29.99, "db_id": 1},
        {"name": "Pro", "credits": 5000, "price": 99.99, "db_id": 2},
        {"name": "Enterprise", "credits": 25000, "price": 299.99, "db_id": 3}
    ]
    
    for package in packages:
        try:
            # First create a Stripe product
            stripe_product = stripe.Product.create(
                name=f'{package["name"]} Credit Package',
                description=f'{package["credits"]} CRM credits for {package["name"]} plan',
                metadata={
                    'credits': package["credits"],
                    'package_name': package["name"]
                }
            )
            
            print(f"✅ Created Stripe product for {package['name']}: {stripe_product.id}")
            
            # Then create a price for that product
            stripe_price = stripe.Price.create(
                unit_amount=int(package["price"] * 100),  # Amount in cents
                currency='usd',
                product=stripe_product.id,
                metadata={
                    'credits': package["credits"],
                    'package_name': package["name"]
                }
            )
            
            print(f"✅ Created Stripe price for {package['name']}: {stripe_price.id}")
            
            # Update database with real Stripe price ID
            with engine.connect() as conn:
                conn.execute(
                    text("""
                        UPDATE credit_packages 
                        SET stripe_price_id = :stripe_price_id 
                        WHERE id = :package_id
                    """),
                    {"stripe_price_id": stripe_price.id, "package_id": package["db_id"]}
                )
                conn.commit()
                print(f"✅ Updated database for {package['name']} with price ID: {stripe_price.id}")
                
        except Exception as e:
            print(f"❌ Error creating price for {package['name']}: {str(e)}")

def main():
    print("🔍 Checking Credit Packages and Stripe Integration...")
    
    # Check current packages
    packages = check_packages()
    
    if not packages:
        print("❌ No credit packages found in database!")
        return
    
    # Test Stripe connection
    try:
        stripe.Account.retrieve()
        print("✅ Stripe connection successful")
    except Exception as e:
        print(f"❌ Stripe connection failed: {str(e)}")
        return
    
    # Create/update Stripe prices
    create_stripe_prices()
    
    print("\n=== Updated Credit Packages ===")
    check_packages()
    
    print("\n🎉 Stripe integration setup complete!")

if __name__ == "__main__":
    main() 