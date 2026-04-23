from fastapi import APIRouter, status

from app.core.dependencies import CurrentUser, DB
from app.schemas.schemas import (
    MessageResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserLogin,
    UserOut,
    UserRegister,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(payload: UserRegister, db: DB):
    """
    Register a new user account.

    - **email**: Valid email address (unique)
    - **username**: Alphanumeric, 3-50 chars (unique)
    - **full_name**: Display name
    - **password**: Min 8 chars, must include uppercase and digit
    """
    user = await auth_service.register_user(payload, db)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and get JWT tokens",
)
async def login(payload: UserLogin, db: DB):
    """
    Authenticate with email and password.

    Returns access token (60 min) and refresh token (7 days).
    Include the access token as `Authorization: Bearer <token>` on subsequent requests.
    """
    return await auth_service.login_user(payload, db)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh(payload: RefreshTokenRequest, db: DB):
    """Use a valid refresh token to get a new access + refresh token pair."""
    return await auth_service.refresh_access_token(payload.refresh_token, db)


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current user profile",
)
async def get_me(current_user: CurrentUser):
    """Returns the profile of the currently authenticated user."""
    return current_user


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout (client-side token invalidation)",
)
async def logout(current_user: CurrentUser):
    """
    Logout endpoint. Since JWTs are stateless, the client must discard the tokens.
    For production, implement a token denylist with Redis.
    """
    return {"message": "Logged out successfully. Please discard your tokens."}
