from prometheus_client import Gauge, Counter, Histogram
from app.core.logger import logger
from typing import Dict, Any

# Database metrics
DB_CONNECTIONS = Gauge('mysql_connections', 'Current database connections')
DB_SLOW_QUERIES = Counter('mysql_slow_queries', 'Number of slow queries')
DB_QUERY_TIME = Histogram('mysql_query_duration_seconds', 'Database query duration')

class DatabaseMetrics:
    def __init__(self, db_session):
        self.db = db_session
    
    async def collect_metrics(self) -> Dict[str, Any]:
        try:
            metrics = await self.db.execute("""
                SELECT VARIABLE_NAME, VARIABLE_VALUE 
                FROM information_schema.GLOBAL_STATUS
                WHERE VARIABLE_NAME IN (
                    'Threads_connected',
                    'Slow_queries',
                    'Questions',
                    'Bytes_received',
                    'Bytes_sent'
                )
            """)
            
            for name, value in metrics:
                if name == 'Threads_connected':
                    DB_CONNECTIONS.set(int(value))
                elif name == 'Slow_queries':
                    DB_SLOW_QUERIES.inc(int(value))
                    
            return dict(metrics)
        except Exception as e:
            logger.error(f"Failed to collect database metrics: {str(e)}")
            return {} 