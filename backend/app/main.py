from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.db.database import create_tables
from app.middleware.error_handlers import (
    RequestIDMiddleware,
    generic_exception_handler,
    validation_exception_handler,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables
    await create_tables()
    yield
    # Shutdown: nothing needed for SQLite; add connection pool cleanup here for Postgres


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="""
## TaskFlow API

A scalable REST API with JWT authentication and role-based access control (RBAC).

### Features
- 🔐 **JWT Authentication** — Access + refresh token flow
- 👥 **RBAC** — `user` and `admin` roles with enforced access policies
- ✅ **Task CRUD** — Full lifecycle management with pagination & filtering
- 🛡️ **Security** — bcrypt hashing, input validation, soft deletes
- 📄 **API Versioning** — All endpoints under `/api/v1/`

### Authentication
1. Register at `POST /api/v1/auth/register`
2. Login at `POST /api/v1/auth/login` — receive `access_token`
3. Set `Authorization: Bearer <access_token>` on all protected requests
        """,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Middleware (order matters: added in reverse execution order)
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Response-Time"],
    )

    # Exception handlers
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    # Routers
    app.include_router(api_router, prefix="/api/v1")

    # Health check
    @app.get("/health", tags=["Health"], include_in_schema=True)
    async def health():
        return {"status": "ok", "version": settings.APP_VERSION}

    return app


app = create_app()
