"""FastAPI application entrypoint.

Wires logging, middleware (request-id, exceptions, CORS, gzip, rate
limit), routers, OpenAPI metadata, lifespan hooks and startup bootstrap.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.router import api_router
from app.core.config import settings
from app.core.database import dispose_engine, get_session_factory
from app.core.logging import get_logger, setup_logging
from app.middleware.request_context import ExceptionHandlingMiddleware, RequestContextMiddleware
from app.utils.rate_limit import limiter

setup_logging()
logger = get_logger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    logger.info("Starting %s (%s)", settings.APP_NAME, settings.APP_ENV)

    if settings.APP_ENV != "testing":
        # Apply schema + seed reference data in development. In production,
        # schema is managed exclusively by Alembic migrations.
        if not settings.is_production:
            from app.database.base import Base
            from app.core.database import get_engine

            async with get_engine().begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            async with get_session_factory()() as session:
                from app.core.bootstrap import bootstrap_database

                await bootstrap_database(session)
        else:
            logger.info("Production mode: schema managed by Alembic, skipping auto-create.")

    yield
    logger.info("Shutting down %s", settings.APP_NAME)
    await dispose_engine()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Enterprise-grade analytics backend for the CSE Admissions process. "
        "Provides JWT auth, RBAC, dynamic dashboard/analytics, search, reports "
        "and bulk imports backed by PostgreSQL."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ----------------------------------------------------------------------
# Middleware
# ----------------------------------------------------------------------
app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)
# Exception handling must be added first (outermost wrapper) so it catches
# AppError before the request-context middleware's safety net.
app.add_middleware(ExceptionHandlingMiddleware)
# Request logging/context
app.add_middleware(RequestContextMiddleware)

# ----------------------------------------------------------------------
# Rate limiting
# ----------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ----------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", include_in_schema=False)
async def root() -> dict:
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "openapi": "/openapi.json",
    }
