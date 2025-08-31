from fastapi import APIRouter

from app.api.routes import attendance, departments, employees, fingerprints, holidays, items, login, private, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(fingerprints.router, prefix="/fingerprints", tags=["fingerprints"])
api_router.include_router(holidays.router, prefix="/holidays", tags=["holidays"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
