from prometheus_client import Counter, Histogram, Gauge
from prometheus_client.openmetrics.exposition import generate_latest
from typing import Dict, Any
import time

# Request metrics
REQUEST_COUNT = Counter(
    'leadlab_http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'leadlab_http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

# Database metrics
DB_CONNECTION_COUNT = Gauge(
    'leadlab_db_connections',
    'Number of active database connections'
)

DB_QUERY_COUNT = Counter(
    'leadlab_db_queries_total',
    'Total number of database queries',
    ['operation']
)

DB_QUERY_DURATION = Histogram(
    'leadlab_db_query_duration_seconds',
    'Database query duration in seconds',
    ['operation'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

# Lead metrics
LEAD_COUNT = Counter(
    'leadlab_leads_total',
    'Total number of leads',
    ['status']
)

LEAD_IMPORT_DURATION = Histogram(
    'leadlab_lead_import_duration_seconds',
    'Lead import duration in seconds',
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 300.0]
)

# User metrics
USER_COUNT = Gauge(
    'leadlab_users_total',
    'Total number of users',
    ['role']
)

USER_ACTION_COUNT = Counter(
    'leadlab_user_actions_total',
    'Total number of user actions',
    ['action_type']
)

# Cache metrics
CACHE_HIT_COUNT = Counter(
    'leadlab_cache_hits_total',
    'Total number of cache hits'
)

CACHE_MISS_COUNT = Counter(
    'leadlab_cache_misses_total',
    'Total number of cache misses'
)

# System metrics
MEMORY_USAGE = Gauge(
    'leadlab_memory_usage_bytes',
    'Memory usage in bytes'
)

CPU_USAGE = Gauge(
    'leadlab_cpu_usage_percent',
    'CPU usage percentage'
)

def get_metrics() -> bytes:
    """Return all metrics in OpenMetrics format"""
    return generate_latest()

class MetricsLogger:
    @staticmethod
    def log_request(method: str, endpoint: str, status: int, duration: float):
        """Log HTTP request metrics"""
        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status=status
        ).inc()
        
        REQUEST_LATENCY.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
        
    @staticmethod
    def log_db_query(operation: str, duration: float):
        """Log database query metrics"""
        DB_QUERY_COUNT.labels(operation=operation).inc()
        DB_QUERY_DURATION.labels(operation=operation).observe(duration)
        
    @staticmethod
    def set_db_connections(count: int):
        """Set current database connection count"""
        DB_CONNECTION_COUNT.set(count)
        
    @staticmethod
    def log_lead_import(count: int, duration: float):
        """Log lead import metrics"""
        LEAD_COUNT.labels(status='imported').inc(count)
        LEAD_IMPORT_DURATION.observe(duration)
        
    @staticmethod
    def set_user_count(role: str, count: int):
        """Set user count for a specific role"""
        USER_COUNT.labels(role=role).set(count)
        
    @staticmethod
    def log_user_action(action_type: str):
        """Log user action"""
        USER_ACTION_COUNT.labels(action_type=action_type).inc()
        
    @staticmethod
    def log_cache_hit():
        """Log cache hit"""
        CACHE_HIT_COUNT.inc()
        
    @staticmethod
    def log_cache_miss():
        """Log cache miss"""
        CACHE_MISS_COUNT.inc()
        
    @staticmethod
    def set_system_metrics(memory_bytes: float, cpu_percent: float):
        """Set system metrics"""
        MEMORY_USAGE.set(memory_bytes)
        CPU_USAGE.set(cpu_percent)

# Global metrics logger instance
metrics_logger = MetricsLogger()