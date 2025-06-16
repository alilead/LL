from prometheus_client import Gauge, Counter, Histogram
from typing import Dict, Any

# Database metrics
DB_TABLE_SIZES = Gauge('mysql_table_sizes_bytes', 'Table sizes in bytes', ['table_name'])
DB_INDEX_USAGE = Gauge('mysql_index_usage', 'Index usage statistics', ['index_name'])
DB_QUERY_TYPES = Counter('mysql_query_types', 'Query type counts', ['query_type'])
DB_DEADLOCKS = Counter('mysql_deadlocks_total', 'Total number of deadlocks')

class DatabaseMonitor:
    def __init__(self, db):
        self.db = db
    
    async def collect_metrics(self) -> Dict[str, Any]:
        try:
            # Monitor table sizes
            sizes = await self.db.execute("""
                SELECT 
                    TABLE_NAME,
                    DATA_LENGTH + INDEX_LENGTH as total_size,
                    INDEX_LENGTH as index_size
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = 'httpdvic1_leadlab'
            """)
            
            # Monitor index usage
            index_stats = await self.db.execute("""
                SELECT 
                    INDEX_NAME, TABLE_NAME,
                    STAT_VALUE as used_count 
                FROM mysql.innodb_index_stats 
                WHERE stat_name = 'n_leaf_pages'
            """)
            
            return {
                "table_metrics": dict(sizes),
                "index_metrics": dict(index_stats)
            }
        except Exception as e:
            logger.error(f"Metrics collection failed: {str(e)}")
            return {} 