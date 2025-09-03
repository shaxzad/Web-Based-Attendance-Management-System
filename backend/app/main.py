import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import logging

from app.api.main import api_router
from app.core.config import settings

# Configure logging for production
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

def custom_generate_unique_id(route: APIRoute) -> str:
    if route.tags and len(route.tags) > 0:
        return f"{route.tags[0]}-{route.name}"
    else:
        return route.name


# Custom security middleware for adding security headers
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    generate_unique_id_function=custom_generate_unique_id,
)

# Production security middleware
if settings.ENVIRONMENT == "production":
    # Trusted host middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]  # Configure with your domain in production
    )
    
    # Security headers middleware
    app.add_middleware(SecurityHeadersMiddleware)

# Compression middleware for better performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Debug CORS configuration
logger.info(f"CORS Configuration - ENVIRONMENT: {settings.ENVIRONMENT}")
logger.info(f"CORS Configuration - FRONTEND_HOST: {settings.FRONTEND_HOST}")
logger.info(f"CORS Configuration - BACKEND_CORS_ORIGINS: {settings.BACKEND_CORS_ORIGINS}")
logger.info(f"CORS Configuration - all_cors_origins: {settings.all_cors_origins}")

# HARDCODED CORS origins to bypass Render environment variable issues
# This is a temporary fix until Render fixes their environment variable handling
HARDCODED_CORS_ORIGINS = [
    "https://lamhatrack.pages.dev",  # Your production frontend
    "http://localhost:5173",         # Local development
    "http://localhost:3000",         # Alternative local port
]

logger.info(f"Using HARDCODED CORS origins: {HARDCODED_CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=HARDCODED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "environment": settings.ENVIRONMENT}

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.PROJECT_NAME} in {settings.ENVIRONMENT} mode")
    
    # Run database migrations on startup
    try:
        import subprocess
        import sys
        logger.info("Running database migrations...")
        result = subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            logger.info("Database migrations completed successfully")
        else:
            logger.warning(f"Database migration failed: {result.stderr}")
    except Exception as e:
        logger.warning(f"Could not run database migrations: {e}")
        logger.info("Application will start without running migrations")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.PROJECT_NAME}")
