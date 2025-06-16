from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
import logging

logger = logging.getLogger(__name__)

class MessageEncryption:
    """Message encryption/decryption service using Fernet symmetric encryption"""
    
    def __init__(self, password: str = None):
        """Initialize encryption with password or environment variable"""
        if password is None:
            password = os.getenv("MESSAGE_ENCRYPTION_KEY", "leadlab-default-encryption-key-2025")
        
        # Generate key from password
        self.key = self._generate_key_from_password(password)
        self.fernet = Fernet(self.key)
    
    def _generate_key_from_password(self, password: str) -> bytes:
        """Generate encryption key from password using PBKDF2"""
        password_bytes = password.encode('utf-8')
        salt = b"leadlab_salt_2025"  # In production, use random salt per message
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password_bytes))
        return key
    
    def encrypt_message(self, message: str) -> str:
        """Encrypt message content"""
        try:
            if not message:
                return ""
            
            message_bytes = message.encode('utf-8')
            encrypted_bytes = self.fernet.encrypt(message_bytes)
            encrypted_str = base64.urlsafe_b64encode(encrypted_bytes).decode('utf-8')
            
            logger.debug(f"Message encrypted successfully (length: {len(encrypted_str)})")
            return encrypted_str
            
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise ValueError(f"Failed to encrypt message: {e}")
    
    def decrypt_message(self, encrypted_message: str) -> str:
        """Decrypt message content"""
        try:
            if not encrypted_message:
                return ""
            
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_message.encode('utf-8'))
            decrypted_bytes = self.fernet.decrypt(encrypted_bytes)
            decrypted_str = decrypted_bytes.decode('utf-8')
            
            logger.debug("Message decrypted successfully")
            return decrypted_str
            
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return "[DECRYPTION_ERROR]"
    
    def is_encrypted(self, message: str) -> bool:
        """Check if message appears to be encrypted"""
        try:
            if not message:
                return False
            
            base64.urlsafe_b64decode(message.encode('utf-8'))
            return len(message) > 50  # Encrypted messages are typically longer
        except:
            return False

# Global encryption instance
encryption_service = MessageEncryption()

# Utility functions
def encrypt_message_content(content: str) -> str:
    """Encrypt message content using global service"""
    return encryption_service.encrypt_message(content)

def decrypt_message_content(encrypted_content: str) -> str:
    """Decrypt message content using global service"""
    # If content is empty, return as is
    if not encrypted_content:
        return encrypted_content
    
    # Check if content appears to be encrypted (base64 encoded and long)
    try:
        # Try to decode as base64 - if it fails, it's probably plain text
        base64.urlsafe_b64decode(encrypted_content.encode('utf-8'))
        
        # If content is too short, it's probably not encrypted
        if len(encrypted_content) < 50:
            logger.debug(f"Content too short to be encrypted, returning as plain text: '{encrypted_content}'")
            return encrypted_content
            
        # Try to decrypt
        decrypted = encryption_service.decrypt_message(encrypted_content)
        if decrypted == "[DECRYPTION_ERROR]":
            logger.warning(f"Decryption failed, returning original content: '{encrypted_content}'")
            return encrypted_content
        
        logger.debug(f"Successfully decrypted message")
        return decrypted
        
    except Exception as e:
        # If base64 decode fails, it's probably plain text
        logger.debug(f"Content appears to be plain text, returning as is: '{encrypted_content}'")
        return encrypted_content 