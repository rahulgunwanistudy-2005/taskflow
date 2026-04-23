from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import AdminUser, DB
from app.models.models import User
from app.schemas.schemas import AdminUserUpdate, UserOut

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/users",
    response_model=list[UserOut],
    summary="[Admin] List all users",
)
async def list_users(current_admin: AdminUser, db: DB):
    """List all registered users. Admin only."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.get(
    "/users/{user_id}",
    response_model=UserOut,
    summary="[Admin] Get user by ID",
)
async def get_user(user_id: int, current_admin: AdminUser, db: DB):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch(
    "/users/{user_id}",
    response_model=UserOut,
    summary="[Admin] Update user role/status",
)
async def update_user(user_id: int, payload: AdminUserUpdate, current_admin: AdminUser, db: DB):
    """Change role (user/admin) or activate/deactivate an account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user
