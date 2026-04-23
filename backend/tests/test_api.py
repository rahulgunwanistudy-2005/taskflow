"""
Integration tests for TaskFlow API.
Uses in-memory SQLite so no external DB needed.

The engine is patched via conftest.py before any app module is imported,
so settings.DATABASE_URL mutation is guaranteed to apply before engine creation.
"""
import asyncio
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db.database import engine, Base
from app.core.config import settings

BASE = "/api/v1"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    """Create all tables in the test in-memory SQLite DB before any test runs."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="session")
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture(scope="session")
async def registered_user(client):
    resp = await client.post(f"{BASE}/auth/register", json={
        "email": "rahul@test.com",
        "username": "rahul_test",
        "full_name": "Rahul Test",
        "password": "SecurePass1"
    })
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture(scope="session")
async def user_token(client, registered_user):
    resp = await client.post(f"{BASE}/auth/login", json={
        "email": "rahul@test.com",
        "password": "SecurePass1"
    })
    assert resp.status_code == 200
    return resp.json()["access_token"]


class TestAuth:
    async def test_register_success(self, client):
        resp = await client.post(f"{BASE}/auth/register", json={
            "email": "new@test.com",
            "username": "newuser",
            "full_name": "New User",
            "password": "SecurePass1"
        })
        assert resp.status_code == 201
        assert resp.json()["role"] == "user"

    async def test_register_duplicate_email(self, client, registered_user):
        resp = await client.post(f"{BASE}/auth/register", json={
            "email": "rahul@test.com",
            "username": "different_username",
            "full_name": "Duplicate",
            "password": "SecurePass1"
        })
        assert resp.status_code == 409

    async def test_register_weak_password(self, client):
        resp = await client.post(f"{BASE}/auth/register", json={
            "email": "weak@test.com",
            "username": "weakuser",
            "full_name": "Weak",
            "password": "weak"
        })
        assert resp.status_code == 422

    async def test_login_success(self, client, registered_user):
        resp = await client.post(f"{BASE}/auth/login", json={
            "email": "rahul@test.com",
            "password": "SecurePass1"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client):
        resp = await client.post(f"{BASE}/auth/login", json={
            "email": "rahul@test.com",
            "password": "WrongPass1"
        })
        assert resp.status_code == 401

    async def test_refresh_token(self, client, registered_user):
        """Refresh token endpoint returns new token pair."""
        login_resp = await client.post(f"{BASE}/auth/login", json={
            "email": "rahul@test.com",
            "password": "SecurePass1"
        })
        refresh_token = login_resp.json()["refresh_token"]
        resp = await client.post(f"{BASE}/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    async def test_get_me(self, client, user_token):
        resp = await client.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {user_token}"})
        assert resp.status_code == 200
        assert resp.json()["email"] == "rahul@test.com"

    async def test_get_me_unauthenticated(self, client):
        resp = await client.get(f"{BASE}/auth/me")
        assert resp.status_code == 403

    async def test_get_me_bad_token(self, client):
        resp = await client.get(f"{BASE}/auth/me", headers={"Authorization": "Bearer notavalidtoken"})
        assert resp.status_code == 401


class TestTasks:
    async def test_create_task(self, client, user_token):
        resp = await client.post(
            f"{BASE}/tasks/",
            json={"title": "Write tests", "description": "TDD", "priority": "high"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Write tests"
        assert data["status"] == "todo"
        assert data["priority"] == "high"

    async def test_create_task_unauthenticated(self, client):
        resp = await client.post(f"{BASE}/tasks/", json={"title": "No auth"})
        assert resp.status_code == 403

    async def test_create_task_empty_title(self, client, user_token):
        resp = await client.post(
            f"{BASE}/tasks/",
            json={"title": ""},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert resp.status_code == 422

    async def test_list_tasks(self, client, user_token):
        resp = await client.get(
            f"{BASE}/tasks/",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        assert "pages" in data
        assert "page" in data
        assert data["total"] >= 1

    async def test_list_tasks_status_filter(self, client, user_token):
        resp = await client.get(
            f"{BASE}/tasks/?status=todo",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert resp.status_code == 200
        for item in resp.json()["items"]:
            assert item["status"] == "todo"

    async def test_get_task_by_id(self, client, user_token):
        # Create a task then fetch it by ID
        create_resp = await client.post(
            f"{BASE}/tasks/",
            json={"title": "Fetch by ID"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        task_id = create_resp.json()["id"]
        resp = await client.get(
            f"{BASE}/tasks/{task_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == task_id

    async def test_get_task_not_found(self, client, user_token):
        resp = await client.get(
            f"{BASE}/tasks/99999",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert resp.status_code == 404

    async def test_update_task(self, client, user_token):
        create_resp = await client.post(
            f"{BASE}/tasks/",
            json={"title": "Update me"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        task_id = create_resp.json()["id"]
        resp = await client.patch(
            f"{BASE}/tasks/{task_id}",
            json={"status": "done", "priority": "low"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "done"
        assert resp.json()["priority"] == "low"

    async def test_delete_task(self, client, user_token):
        create_resp = await client.post(
            f"{BASE}/tasks/",
            json={"title": "Delete me"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        task_id = create_resp.json()["id"]
        resp = await client.delete(
            f"{BASE}/tasks/{task_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert resp.status_code == 204
        # Confirm soft-deleted — 404 on fetch
        get_resp = await client.get(
            f"{BASE}/tasks/{task_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert get_resp.status_code == 404

    async def test_admin_endpoint_blocked_for_user(self, client, user_token):
        resp = await client.get(
            f"{BASE}/admin/users",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert resp.status_code == 403


class TestHealth:
    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
        assert "version" in resp.json()

    async def test_docs_accessible(self, client):
        resp = await client.get("/docs")
        assert resp.status_code == 200

    async def test_openapi_schema(self, client):
        resp = await client.get("/openapi.json")
        assert resp.status_code == 200
        schema = resp.json()
        assert schema["info"]["title"] == "TaskFlow API"
        assert "/api/v1/auth/register" in schema["paths"]
        assert "/api/v1/tasks/" in schema["paths"]
