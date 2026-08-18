"""API v1 router aggregating all feature modules."""

from fastapi import APIRouter

from app.api.auth import routes as auth_routes
from app.api.dashboard import routes as dashboard_routes
from app.api.analytics import routes as analytics_routes
from app.api.students import routes as student_routes
from app.api.reports import routes as report_routes
from app.api.search import routes as search_routes
from app.api.uploads import routes as upload_routes
from app.api.settings import routes as settings_routes
from app.api.health import routes as health_routes

api_router = APIRouter()

api_router.include_router(health_routes.router)
api_router.include_router(auth_routes.router)
api_router.include_router(dashboard_routes.router)
api_router.include_router(analytics_routes.router)
api_router.include_router(student_routes.router)
api_router.include_router(search_routes.router)
api_router.include_router(report_routes.router)
api_router.include_router(upload_routes.router)
api_router.include_router(settings_routes.router)

__all__ = ["api_router"]
