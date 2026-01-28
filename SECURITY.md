# Security Best Practices - LeadLab CRM

## Overview

This document outlines the security measures implemented in LeadLab CRM and best practices for maintaining a secure application.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [Input Validation](#input-validation)
4. [API Security](#api-security)
5. [Environment Variables](#environment-variables)
6. [Database Security](#database-security)
7. [Frontend Security](#frontend-security)
8. [Deployment Security](#deployment-security)
9. [Security Checklist](#security-checklist)

---

## Authentication & Authorization

### JWT Tokens
- **Access Token Expiry**: 24 hours (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Refresh Token Expiry**: 7 days (configurable via `REFRESH_TOKEN_EXPIRE_DAYS`)
- **Algorithm**: HS256
- **Storage**: Access tokens in localStorage, refresh tokens in httpOnly cookies (recommended)

### Password Requirements
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Hashed using bcrypt with salt rounds

### Protected Endpoints
All enterprise endpoints require authentication:
```python
current_user: User = Depends(deps.get_current_user)
```

Organization-level authorization:
```python
if resource.organization_id != current_user.organization_id:
    raise HTTPException(status_code=403, detail="Access denied")
```

---

## Data Protection

### Sensitive Data Encryption

**Database Credentials**:
- NEVER hardcode credentials in source code
- Use environment variables for all secrets
- Example removed: hardcoded password in `main.py` health check

**CRM Connection Credentials**:
- Stored in `crm_connections` table
- **TODO**: Implement encryption at rest using `cryptography` library
```python
from cryptography.fernet import Fernet
# Encrypt before storing in database
```

**API Keys**:
- Stored in environment variables only
- Never logged or exposed in error messages
- Rotated regularly

### Data at Rest
- MySQL database with encrypted connections (SSL/TLS)
- File uploads stored outside web root
- Maximum upload size: 10MB

### Data in Transit
- HTTPS/TLS 1.2+ required for production
- Secure WebSocket connections (WSS)
- HSTS headers enforced

---

## Input Validation

### Security Utilities (`app/core/security_utils.py`)

**Email Validation**:
```python
from app.core.security_utils import validate_email
email = validate_email(user_input_email)
```

**String Sanitization**:
```python
from app.core.security_utils import sanitize_string
safe_text = sanitize_string(user_input, max_length=500)
```

**Prevented Attacks**:
- SQL Injection: Parameterized queries + pattern detection
- XSS: Script tag detection and sanitization
- Path Traversal: Filename sanitization
- SSRF: URL validation blocks private IPs

### Pydantic Schemas
All API endpoints use Pydantic for automatic validation:
```python
class ImportJobCreate(BaseModel):
    source_type: str = Field(..., max_length=50)
    entity_type: str = Field(..., max_length=50)
    field_mapping: Optional[Dict[str, str]] = None
```

---

## API Security

### Rate Limiting (`app/middleware/security.py`)
```python
from app.middleware.security import add_security_headers
add_security_headers(app)
```

**Default Limits**:
- 60 requests per minute per IP
- Configurable per endpoint
- Returns 429 Too Many Requests when exceeded

### Security Headers
Automatically added to all responses:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

### CORS Configuration
Whitelist only trusted origins:
```python
CORS_ORIGINS = [
    "https://www.the-leadlab.com",
    "https://the-leadlab.com",
    "https://api.the-leadlab.com"
]
```

**Development**: Add `http://localhost:5173` only during development

### Request Size Limits
- JSON payload: 10MB max
- File upload: 10MB max
- JSON nesting depth: 10 levels max
- JSON keys: 100 max

---

## Environment Variables

### Required Variables

**Backend** (`backend/.env`):
```bash
# Security Keys (REQUIRED)
SECRET_KEY=<generate-with-openssl-rand-hex-32>
TOKEN_ENCRYPTION_KEY=<generate-with-cryptography-fernet>
API_SECRET_KEY=<generate-secure-random-string>

# Database (REQUIRED)
DATABASE_URL=mysql+pymysql://user:password@host:3306/leadlab

# SMTP Email (REQUIRED)
SMTP_PASSWORD=<smtp-password>
INVOICE_EMAIL_PASSWORD=<invoice-email-password>

# LinkedIn OAuth (REQUIRED)
LINKEDIN_CLIENT_ID=<your-client-id>
LINKEDIN_CLIENT_SECRET=<your-client-secret>

# Stripe (REQUIRED)
STRIPE_SECRET_KEY=<sk_live_or_test>
STRIPE_PUBLISHABLE_KEY=<pk_live_or_test>
STRIPE_WEBHOOK_SECRET=<whsec_...>

# Optional
CRYSTAL_KNOWS_API_KEY=<optional-for-psychometrics>
```

**Frontend** (`frontend/.env.production`):
```bash
VITE_API_URL=https://api.the-leadlab.com
VITE_LINKEDIN_REDIRECT_URI=https://www.the-leadlab.com/linkedin/callback
```

### Generating Secure Keys

**SECRET_KEY**:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**TOKEN_ENCRYPTION_KEY**:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Never Commit
Add to `.gitignore`:
```
.env
.env.local
.env.production
*.key
*.pem
config/secrets.json
```

---

## Database Security

### Connection Security
```python
# Use connection pooling with limits
MYSQL_POOL_SIZE = 5
MYSQL_MAX_OVERFLOW = 2
MYSQL_POOL_TIMEOUT = 30
MYSQL_POOL_RECYCLE = 300  # Recycle connections every 5 minutes
```

### SQL Injection Prevention
✅ **Safe** - Parameterized queries:
```python
db.query(Lead).filter(Lead.id == lead_id).first()
```

❌ **UNSAFE** - String concatenation:
```python
# NEVER DO THIS
db.execute(f"SELECT * FROM leads WHERE id = {lead_id}")
```

### Database User Permissions
- Application user: SELECT, INSERT, UPDATE, DELETE only
- No DROP, ALTER, or GRANT permissions
- Separate admin user for migrations

### Backups
- Daily automated backups
- Encrypted at rest
- Stored in separate location
- Tested monthly

---

## Frontend Security

### XSS Prevention
- React automatically escapes JSX content
- Sanitize dangerouslySetInnerHTML usage
- Content Security Policy (CSP) headers

### Authentication Token Storage
```typescript
// Access token in localStorage (or sessionStorage)
localStorage.setItem('token', accessToken);

// Refresh token in httpOnly cookie (recommended)
// Set by backend, inaccessible to JavaScript
```

### CSRF Protection
- SameSite cookie attribute: `Strict` or `Lax`
- CSRF token in headers for state-changing requests

### Dependency Security
```bash
# Regular security audits
npm audit
npm audit fix

# Check for outdated packages
npm outdated
```

---

## Deployment Security

### Production Checklist

**Backend**:
- [ ] Set `DEBUG=False`
- [ ] Use strong `SECRET_KEY` (32+ characters)
- [ ] Enable HTTPS/TLS only
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Disable directory listing
- [ ] Remove `.git` folder from production
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Use reverse proxy (Nginx/Apache)
- [ ] Enable database SSL connections

**Frontend**:
- [ ] Build for production (`npm run build`)
- [ ] Enable HTTPS
- [ ] Set security headers
- [ ] Configure CSP
- [ ] Minimize JavaScript bundle
- [ ] Remove source maps

**Database**:
- [ ] Change default root password
- [ ] Disable remote root access
- [ ] Use SSL/TLS connections
- [ ] Enable query logging for auditing
- [ ] Regular backups automated
- [ ] Firewall rules (allow only app server)

---

## Security Checklist

### Development
- [ ] Use `.env.example` as template, never commit `.env`
- [ ] Run security linters (bandit, safety)
- [ ] Code review for security issues
- [ ] Test authentication and authorization
- [ ] Validate all user inputs
- [ ] Log security events

### Before Deployment
- [ ] Change all default passwords
- [ ] Generate new production SECRET_KEY
- [ ] Update CORS_ORIGINS to production URLs
- [ ] Enable HTTPS enforcement
- [ ] Set up error monitoring (Sentry)
- [ ] Configure log rotation
- [ ] Test backup/restore procedures

### Regular Maintenance
- [ ] Weekly: Review access logs for anomalies
- [ ] Monthly: Update dependencies (`pip update`, `npm update`)
- [ ] Quarterly: Security audit
- [ ] Annually: Penetration testing
- [ ] Rotate API keys and secrets
- [ ] Review user permissions

---

## Reporting Security Issues

**DO NOT** create public GitHub issues for security vulnerabilities.

Email security reports to: **security@the-leadlab.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We'll respond within 24 hours and provide updates every 3 days until resolved.

---

## Compliance

### GDPR Compliance
- User data export functionality
- Right to deletion (account deletion API)
- Consent management
- Data retention policies

### SOC 2 (Future)
- Access controls documented
- Audit logging enabled
- Encryption at rest and in transit
- Regular security assessments

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security Guide](https://fastapi.tiangolo.com/tutorial/security/)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [MySQL Security Guide](https://dev.mysql.com/doc/refman/8.0/en/security-guidelines.html)

---

**Last Updated**: November 5, 2025
**Version**: 1.0.0
