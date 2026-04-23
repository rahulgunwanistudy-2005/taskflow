import math

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Task, TaskStatus, User, UserRole
from app.schemas.schemas import PaginatedTasks, TaskCreate, TaskOut, TaskUpdate


async def create_task(payload: TaskCreate, owner: User, db: AsyncSession) -> Task:
    task = Task(
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        due_date=payload.due_date,
        owner_id=owner.id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def get_tasks(
    db: AsyncSession,
    current_user: User,
    page: int = 1,
    size: int = 20,
    status_filter: TaskStatus | None = None,
) -> PaginatedTasks:
    # Admins see all tasks; users see only their own
    base_query = select(Task).where(Task.is_deleted.is_(False))
    count_query = select(func.count()).select_from(Task).where(Task.is_deleted.is_(False))

    if current_user.role != UserRole.ADMIN:
        base_query = base_query.where(Task.owner_id == current_user.id)
        count_query = count_query.where(Task.owner_id == current_user.id)

    if status_filter:
        base_query = base_query.where(Task.status == status_filter)
        count_query = count_query.where(Task.status == status_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (page - 1) * size
    result = await db.execute(
        base_query.order_by(Task.created_at.desc()).offset(offset).limit(size)
    )
    tasks = result.scalars().all()

    return PaginatedTasks(
        items=[TaskOut.model_validate(t) for t in tasks],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


async def get_task_by_id(task_id: int, current_user: User, db: AsyncSession) -> Task:
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.is_deleted.is_(False))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Non-admins can only see their own tasks
    if current_user.role != UserRole.ADMIN and task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return task


async def update_task(
    task_id: int, payload: TaskUpdate, current_user: User, db: AsyncSession
) -> Task:
    task = await get_task_by_id(task_id, current_user, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    return task


async def delete_task(task_id: int, current_user: User, db: AsyncSession) -> None:
    task = await get_task_by_id(task_id, current_user, db)
    task.is_deleted = True  # soft delete
    await db.commit()
