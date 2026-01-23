from pathlib import Path

DEPLOYMENT_CONFIG = {
    "web_root": "/home/httpdvic1/public_html",
    "tmp_path": "/home/httpdvic1/tmp",
    "log_path": "/home/httpdvic1/logs",
    
    "allowed_php_versions": ["7.4", "8.0", "8.1", "8.2"],
    "default_php_version": "8.1",
    
    "cron_jobs": [
        {
            "command": "php /home/httpdvic1/public_html/artisan schedule:run",
            "schedule": "* * * * *"
        },
        {
            "command": "python /home/httpdvic1/public_html/manage.py clearsessions",
            "schedule": "0 0 * * *"
        }
    ],
    
    "backup_settings": {
        "enabled": True,
        "frequency": "daily",
        "retention_days": 7,
        "include_dirs": ["public_html", "private", "logs"],
        "exclude_patterns": ["*.tmp", "*.log", "cache/*"]
    }
} 