from fastapi import APIRouter

from app.api.routes import departments, employees, items, login, private, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
