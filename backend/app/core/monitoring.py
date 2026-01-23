import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import FastAPI
from app.core.config import settings

def init_monitoring(app: FastAPI) -> None:
    # Sentry yapılandırması
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
                RedisIntegration(),
            ],
            send_default_pii=False,
            debug=settings.DEBUG,
            max_breadcrumbs=50,
            attach_stacktrace=True,
            request_bodies='medium',
            release=settings.VERSION
        )

    # Prometheus metrics
    Instrumentator().instrument(app).expose(app, include_in_schema=False, tags=["monitoring"])
