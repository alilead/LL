"""
Security Utilities

Common security functions for input validation, sanitization, and encryption.
"""

import re
import hashlib
import secrets
from typing import Optional
from fastapi import HTTPException, status


# Input Validation Patterns
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
PHONE_PATTERN = re.compile(r'^\+?[1-9]\d{1,14}$')  # E.164 format
URL_PATTERN = re.compile(
    r'^https?://'  # http:// or https://
    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
    r'localhost|'  # localhost...
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
    r'(?::\d+)?'  # optional port
    r'(?:/?|[/?]\S+)$', re.IGNORECASE
)

# Dangerous characters for SQL injection prevention
SQL_INJECTION_PATTERNS = [
    r"(\bUNION\b.*\bSELECT\b)",
    r"(\bINSERT\b.*\bINTO\b)",
    r"(\bUPDATE\b.*\bSET\b)",
    r"(\bDELETE\b.*\bFROM\b)",
    r"(\bDROP\b.*\bTABLE\b)",
    r"(--)",
    r"(;.*--)",
    r"(\bOR\b.*=.*)",
    r"(\bAND\b.*=.*)"
]

# XSS patterns
XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"onerror\s*=",
    r"onload\s*=",
    r"onclick\s*=",
    r"<iframe",
]


def validate_email(email: str) -> str:
    """
    Validate and sanitize email address

    Args:
        email: Email address to validate

    Returns:
        Validated email address

    Raises:
        HTTPException: If email is invalid
    """
    if not email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email is required"
        )

    email = email.strip().lower()

    if not EMAIL_PATTERN.match(email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid email format"
        )

    if len(email) > 254:  # RFC 5321
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email too long"
        )

    return email


def validate_phone(phone: str) -> str:
    """
    Validate phone number

    Args:
        phone: Phone number to validate

    Returns:
        Validated phone number

    Raises:
        HTTPException: If phone is invalid
    """
    if not phone:
        return phone

    # Remove common separators
    phone = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")

    if not PHONE_PATTERN.match(phone):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid phone number format. Use E.164 format (e.g., +1234567890)"
        )

    return phone


def validate_url(url: str) -> str:
    """
    Validate URL

    Args:
        url: URL to validate

    Returns:
        Validated URL

    Raises:
        HTTPException: If URL is invalid
    """
    if not url:
        return url

    url = url.strip()

    if not URL_PATTERN.match(url):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid URL format"
        )

    # Prevent SSRF attacks - block private IPs
    if any(private in url.lower() for private in ['localhost', '127.0.0.1', '0.0.0.0', '::1']):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Private IP addresses are not allowed"
        )

    return url


def sanitize_string(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize string input to prevent XSS and SQL injection

    Args:
        text: Text to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized text

    Raises:
        HTTPException: If text contains dangerous patterns
    """
    if not text:
        return text

    text = text.strip()

    # Check for SQL injection patterns
    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Input contains potentially dangerous SQL patterns"
            )

    # Check for XSS patterns
    for pattern in XSS_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Input contains potentially dangerous script patterns"
            )

    # Check length
    if max_length and len(text) > max_length:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Input too long. Maximum {max_length} characters allowed"
        )

    return text


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks

    Args:
        filename: Filename to sanitize

    Returns:
        Sanitized filename

    Raises:
        HTTPException: If filename is invalid
    """
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Filename is required"
        )

    # Remove path components
    filename = filename.replace('/', '').replace('\\', '').replace('..', '')

    # Remove dangerous characters
    filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)

    if not filename:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid filename"
        )

    if len(filename) > 255:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Filename too long"
        )

    return filename


def generate_secure_token(length: int = 32) -> str:
    """
    Generate cryptographically secure random token

    Args:
        length: Length of token in bytes

    Returns:
        Secure random token (hex string)
    """
    return secrets.token_hex(length)


def hash_sensitive_data(data: str, salt: Optional[str] = None) -> str:
    """
    Hash sensitive data for secure storage

    Args:
        data: Data to hash
        salt: Optional salt (generated if not provided)

    Returns:
        Hashed data with salt
    """
    if not salt:
        salt = secrets.token_hex(16)

    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        data.encode('utf-8'),
        salt.encode('utf-8'),
        100000  # iterations
    )

    return f"{salt}:{hashed.hex()}"


def verify_hashed_data(data: str, hashed: str) -> bool:
    """
    Verify data against hash

    Args:
        data: Data to verify
        hashed: Hash to verify against (format: salt:hash)

    Returns:
        True if data matches hash
    """
    try:
        salt, hash_value = hashed.split(':')
        new_hash = hash_sensitive_data(data, salt)
        return new_hash == hashed
    except Exception:
        return False


def validate_json_field(data: dict, max_depth: int = 10, max_keys: int = 100) -> dict:
    """
    Validate JSON data to prevent resource exhaustion attacks

    Args:
        data: JSON data to validate
        max_depth: Maximum nesting depth
        max_keys: Maximum number of keys

    Returns:
        Validated JSON data

    Raises:
        HTTPException: If JSON is invalid
    """
    def check_depth(obj, current_depth=0):
        if current_depth > max_depth:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"JSON nesting too deep. Maximum {max_depth} levels allowed"
            )

        if isinstance(obj, dict):
            if len(obj) > max_keys:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Too many keys in JSON. Maximum {max_keys} allowed"
                )
            for value in obj.values():
                check_depth(value, current_depth + 1)
        elif isinstance(obj, list):
            for item in obj:
                check_depth(item, current_depth + 1)

    check_depth(data)
    return data
