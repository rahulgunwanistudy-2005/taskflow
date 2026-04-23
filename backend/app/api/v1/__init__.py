from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, tasks

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(tasks.router)
api_router.include_router(admin.router)
