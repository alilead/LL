from prometheus_client import Counter, Histogram, start_http_server

REQUEST_COUNT = Counter(
    'request_count',
    'App Request Count',
    ['method', 'endpoint', 'http_status']
)

REQUEST_LATENCY = Histogram(
    'request_latency_seconds',
    'Request latency',
    ['method', 'endpoint']
)

def start_metrics_server(port: int = 9090):
    start_http_server(port) 