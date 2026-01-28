# Security Setup Guide - LeadLab Backend

## Quick Start

### 1. Generate Required Security Keys

**SECRET_KEY** (JWT signing):
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**TOKEN_ENCRYPTION_KEY** (for encrypting tokens):
```bash
pip install cryptography
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**API_SECRET_KEY** (general API security):
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Create `.env` File

Copy the example and fill in your values:
```bash
cp .env.example .env
nano .env  # or use your favorite editor
```

**Required Variables to Update**:
```bash
# Security Keys
SECRET_KEY=<paste-generated-secret-key-here>
TOKEN_ENCRYPTION_KEY=<paste-generated-token-encryption-key-here>
API_SECRET_KEY=<paste-generated-api-secret-key-here>

# Database
DATABASE_URL=mysql+pymysql://leadlab_admin:YOUR_DB_PASSWORD@localhost:3306/leadlab?charset=utf8mb4

# SMTP Email
SMTP_PASSWORD=your-smtp-password-here
INVOICE_EMAIL_PASSWORD=your-invoice-email-password-here

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Stripe Payments
STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Database Setup

**Create Database User**:
```sql
CREATE USER 'leadlab_admin'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
CREATE DATABASE leadlab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT SELECT, INSERT, UPDATE, DELETE ON leadlab.* TO 'leadlab_admin'@'localhost';
FLUSH PRIVILEGES;
```

**Run Migrations**:
```bash
# Run all SQL migrations in order
mysql -u leadlab_admin -p leadlab < migrations/add_enterprise_features.sql
mysql -u leadlab_admin -p leadlab < migrations/add_data_import_export.sql
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Run Application

**Development**:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Production** (use gunicorn):
```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## Security Middleware

### Enable Security Headers

In `main.py`:
```python
from app.middleware.security import add_security_headers

# Add after CORS middleware
add_security_headers(app)
```

This adds:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Referrer-Policy

### Enable Rate Limiting

Rate limiting is automatically enabled via SecurityMiddleware.

Configure limits in middleware initialization:
```python
app.add_middleware(
    SecurityMiddleware,
    max_requests_per_minute=60,  # Adjust as needed
    max_request_size=10 * 1024 * 1024  # 10MB
)
```

---

## Input Validation

### Using Security Utilities

**Validate Email**:
```python
from app.core.security_utils import validate_email

try:
    clean_email = validate_email(user_input)
except HTTPException as e:
    # Handle validation error
    return {"error": e.detail}
```

**Sanitize String Input**:
```python
from app.core.security_utils import sanitize_string

safe_text = sanitize_string(user_input, max_length=500)
```

**Sanitize Filename**:
```python
from app.core.security_utils import sanitize_filename

safe_filename = sanitize_filename(uploaded_file.filename)
```

**Validate JSON**:
```python
from app.core.security_utils import validate_json_field

safe_json = validate_json_field(
    user_json_data,
    max_depth=10,
    max_keys=100
)
```

---

## Authentication & Authorization

### Protecting Endpoints

**Require Authentication**:
```python
from app.api import deps
from app.models.user import User

@router.get("/protected-resource")
def get_resource(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Only authenticated users can access
    return {"data": "sensitive data"}
```

**Require Active User**:
```python
@router.get("/protected-resource")
def get_resource(
    current_user: User = Depends(deps.get_current_active_user)
):
    # Only active (non-disabled) users can access
    return {"data": "sensitive data"}
```

**Organization-Level Authorization**:
```python
@router.get("/resources/{resource_id}")
def get_resource(
    resource_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Check organization access
    if resource.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return resource
```

---

## Environment-Specific Configuration

### Development
```bash
ENV=development
DEBUG=True
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

### Production
```bash
ENV=production
DEBUG=False
FRONTEND_URL=https://www.the-leadlab.com
CORS_ORIGINS=["https://www.the-leadlab.com","https://the-leadlab.com"]
```

---

## HTTPS/TLS Setup

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.the-leadlab.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.the-leadlab.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/api.the-leadlab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.the-leadlab.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to FastAPI
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Let's Encrypt SSL Certificate

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.the-leadlab.com

# Auto-renewal (add to crontab)
0 0 1 * * certbot renew --quiet
```

---

## Database Security

### MySQL Secure Configuration

```bash
# Run MySQL secure installation
sudo mysql_secure_installation
```

### Enable SSL Connections

In `my.cnf`:
```ini
[mysqld]
require_secure_transport=ON
ssl-ca=/path/to/ca-cert.pem
ssl-cert=/path/to/server-cert.pem
ssl-key=/path/to/server-key.pem
```

Update `DATABASE_URL`:
```bash
DATABASE_URL=mysql+pymysql://user:pass@host:3306/db?ssl_ca=/path/to/ca-cert.pem&ssl_verify_cert=true
```

---

## Monitoring & Logging

### Error Monitoring (Sentry)

```bash
pip install sentry-sdk[fastapi]
```

In `main.py`:
```python
import sentry_sdk

sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    environment="production",
    traces_sample_rate=0.1,
)
```

### Logging Configuration

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/leadlab/app.log'),
        logging.StreamHandler()
    ]
)

# Security events
security_logger = logging.getLogger('security')
security_logger.info(f'Failed login attempt from {ip_address}')
```

---

## Backup & Recovery

### Automated Backups

```bash
#!/bin/bash
# /etc/cron.daily/backup-leadlab

BACKUP_DIR="/backups/leadlab"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
mysqldump -u leadlab_admin -p$DB_PASSWORD leadlab | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Encrypt backup
gpg --encrypt --recipient admin@the-leadlab.com "$BACKUP_DIR/db_$DATE.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz.gpg" -mtime +30 -delete
```

---

## Security Checklist

### Before Going Live

- [ ] All `.env` variables set with secure values
- [ ] SECRET_KEY is strong and unique
- [ ] DEBUG=False in production
- [ ] HTTPS/TLS enabled and enforced
- [ ] Database user has minimal permissions
- [ ] Database backups automated
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] CORS limited to production domains
- [ ] Error monitoring (Sentry) configured
- [ ] Logging enabled and monitored
- [ ] File upload size limits set
- [ ] SQL injection tests passed
- [ ] XSS tests passed
- [ ] Authentication tests passed

---

## Troubleshooting

### Common Issues

**"SECRET_KEY must be set"**:
- Generate and add SECRET_KEY to `.env`

**"Database connection failed"**:
- Check DATABASE_URL format
- Verify database user permissions
- Ensure MySQL is running

**"CORS error"**:
- Add frontend URL to CORS_ORIGINS in `.env`
- Verify CORS middleware is enabled

**"Token expired"**:
- Check system time (NTP sync)
- Verify SECRET_KEY hasn't changed
- Check ACCESS_TOKEN_EXPIRE_MINUTES

---

## Support

For security-related issues, email: **security@the-leadlab.com**

**DO NOT** post security vulnerabilities publicly.
