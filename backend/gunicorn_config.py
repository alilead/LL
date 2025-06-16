import multiprocessing
import os

# Server Socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker Processes
workers = 2
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 300
keepalive = 65
max_requests = 1000
max_requests_jitter = 50

# Process Naming
proc_name = "leadlab_backend"
default_proc_name = "leadlab_backend"

# Logging
accesslog = "/var/www/vhosts/the-leadlab.com/backend/logs/access.log"
errorlog = "/var/www/vhosts/the-leadlab.com/backend/logs/error.log"
loglevel = "debug"
capture_output = True

# Process ID
pidfile = "/var/www/vhosts/the-leadlab.com/backend/leadlab.pid"

# SSL
keyfile = None
certfile = None

# Server Mechanics
daemon = False
umask = 0
