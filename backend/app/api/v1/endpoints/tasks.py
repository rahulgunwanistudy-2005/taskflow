from typing import Optional

from fastapi import APIRouter, Query, status

from app.core.dependencies import CurrentUser, DB
from app.models.models import TaskStatus
from app.schemas.schemas import PaginatedTasks, TaskCreate, TaskOut, TaskUpdate
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "/",
    response_model=TaskOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
)
async def create_task(payload: TaskCreate, current_user: CurrentUser, db: DB):
    """Create a task owned by the current user."""
    task = await task_service.create_task(payload, current_user, db)
    return task


@router.get(
    "/",
    response_model=PaginatedTasks,
    summary="List tasks (paginated)",
)
async def list_tasks(
    current_user: CurrentUser,
    db: DB,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
):
    """
    List tasks with pagination.
    - **Users** see only their own tasks.
    - **Admins** see all tasks across all users.
    """
    return await task_service.get_tasks(db, current_user, page, size, status)


@router.get(
    "/{task_id}",
    response_model=TaskOut,
    summary="Get a single task",
)
async def get_task(task_id: int, current_user: CurrentUser, db: DB):
    """Retrieve a task by ID. Users can only access their own tasks."""
    return await task_service.get_task_by_id(task_id, current_user, db)


@router.patch(
    "/{task_id}",
    response_model=TaskOut,
    summary="Update a task (partial)",
)
async def update_task(task_id: int, payload: TaskUpdate, current_user: CurrentUser, db: DB):
    """Partially update a task. All fields are optional."""
    return await task_service.update_task(task_id, payload, current_user, db)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a task",
)
async def delete_task(task_id: int, current_user: CurrentUser, db: DB):
    """Soft-delete a task (it remains in DB but is invisible)."""
    await task_service.delete_task(task_id, current_user, db)
