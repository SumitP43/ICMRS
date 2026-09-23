import time
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.core.logging import logger
from backend.app.core.exceptions import ICMRSException
from backend.app.database.session import init_db
from backend.app.database.seed import seed_database
from backend.app.api.v1 import (
    auth as auth_v1,
    complaints as complaints_v1,
    departments as departments_v1,
    officers as officers_v1,
    notifications as notifications_v1,
    analytics as analytics_v1,
    websocket as websocket_v1
)
from backend.app.workers.sla_tasks import check_all_sla_deadlines_task

# Background SLA monitor loop
async def _periodic_sla_checker():
    while True:
        try:
            await asyncio.sleep(60)  # Check SLA status every minute
            check_all_sla_deadlines_task()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Periodic SLA checker error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing ICMRS Backend services...")
    init_db()
    try:
        seed_database()
    except Exception as e:
        logger.warning(f"Database seed note: {e}")
    sla_task = asyncio.create_task(_periodic_sla_checker())
    logger.info("ICMRS Backend initialized and ready to serve requests.")
    yield
    # Shutdown
    sla_task.cancel()
    logger.info("ICMRS Backend shutdown completed.")

app = FastAPI(
    title="ICMRS Civic Management & Response API",
    description="Production-grade AI/ML-based Civic Complaint Management and Response System Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    logger.info(
        f"{request.method} {request.url.path} -> Status {response.status_code} ({duration_ms}ms)"
    )
    return response

# Custom ICMRS Exception handler
@app.exception_handler(ICMRSException)
async def icmrs_exception_handler(request: Request, exc: ICMRSException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code,
            "details": exc.details
        }
    )

# Generic 500 handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error occurred in ICMRS processing engine.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )

# Health check endpoints
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "ICMRS Backend",
        "version": "1.0.0",
        "timestamp": time.time()
    }

# Mount v1 routers under /api/v1
app.include_router(auth_v1.router, prefix="/api/v1")
app.include_router(complaints_v1.router, prefix="/api/v1")
app.include_router(departments_v1.router, prefix="/api/v1")
app.include_router(officers_v1.router, prefix="/api/v1")
app.include_router(notifications_v1.router, prefix="/api/v1")
app.include_router(analytics_v1.router, prefix="/api/v1")
app.include_router(websocket_v1.router)

# Mount direct routes under /api for seamless backwards compatibility with existing frontend
app.include_router(auth_v1.router, prefix="/api")
app.include_router(complaints_v1.router, prefix="/api")
app.include_router(departments_v1.router, prefix="/api")
app.include_router(officers_v1.router, prefix="/api")
app.include_router(notifications_v1.router, prefix="/api")
app.include_router(analytics_v1.router, prefix="/api")
