#!/usr/bin/env python3
"""
Script to encrypt existing plain text messages in the database
Run this once after implementing encryption to secure existing messages
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.encryption import encrypt_message_content, encryption_service
from app.db.database import SessionLocal
from app.models.message import Message

def encrypt_existing_messages():
    """Encrypt all existing plain text messages"""
    db = SessionLocal()
    
    try:
        # Get all messages
        messages = db.query(Message).all()
        encrypted_count = 0
        skipped_count = 0
        
        for msg in messages:
            # Check if message is already encrypted
            if encryption_service.is_encrypted(msg.content):
                print(f"Message {msg.id} already encrypted, skipping...")
                skipped_count += 1
                continue
            
            try:
                # Store original content
                original_content = msg.content
                
                # Encrypt the content
                encrypted_content = encrypt_message_content(original_content)
                
                # Update message in database
                msg.content = encrypted_content
                db.commit()
                
                print(f"✅ Message {msg.id} encrypted successfully")
                encrypted_count += 1
                
            except Exception as e:
                print(f"❌ Failed to encrypt message {msg.id}: {e}")
                db.rollback()
        
        print(f"\n📊 Migration Results:")
        print(f"   • Encrypted: {encrypted_count} messages")
        print(f"   • Skipped: {skipped_count} messages")
        print(f"   • Total: {len(messages)} messages")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔐 Starting message encryption migration...")
    encrypt_existing_messages()
    print("✨ Migration completed!") 