# TaskFlow API

A production-grade REST API with JWT authentication, role-based access control (RBAC), and a React frontend. Built with FastAPI, SQLAlchemy (async), and Vite/React.

---

## Quick Start

### Option A — Docker (recommended)

```bash
git clone <repo>
cd taskflow
docker-compose up --build
```

| Service   | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost:5173            |
| API       | http://localhost:8000            |
| Swagger   | http://localhost:8000/docs       |
| ReDoc     | http://localhost:8000/redoc      |

### Option B — Local dev

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## Architecture

```
taskflow/
├── backend/
│   └── app/
│       ├── api/v1/endpoints/   # auth.py, tasks.py, admin.py
│       ├── core/               # config.py, security.py, dependencies.py
│       ├── db/                 # database.py (async SQLAlchemy)
│       ├── middleware/         # error_handlers.py (request ID, validation)
│       ├── models/             # User, Task ORM models
│       ├── schemas/            # Pydantic v2 request/response schemas
│       ├── services/           # auth_service.py, task_service.py
│       └── main.py             # FastAPI app factory
└── frontend/
    └── src/
        ├── App.jsx             # Full React SPA (auth + dashboard)
        └── api.js              # Typed API client
```

---

## API Reference

All endpoints are versioned under `/api/v1/`.

### Authentication

| Method | Path               | Auth | Description               |
|--------|--------------------|------|---------------------------|
| POST   | /auth/register     | —    | Register new user          |
| POST   | /auth/login        | —    | Login → JWT tokens         |
| POST   | /auth/refresh      | —    | Rotate access + refresh    |
| GET    | /auth/me           | ✓    | Current user profile       |
| POST   | /auth/logout       | ✓    | Logout (client-side)       |

### Tasks

| Method | Path               | Auth | Description               |
|--------|--------------------|------|---------------------------|
| POST   | /tasks/            | ✓    | Create task                |
| GET    | /tasks/            | ✓    | List tasks (paginated)     |
| GET    | /tasks/{id}        | ✓    | Get single task            |
| PATCH  | /tasks/{id}        | ✓    | Partial update             |
| DELETE | /tasks/{id}        | ✓    | Soft delete                |

Query params: `page`, `size`, `status` (todo | in_progress | done)

### Admin (role: admin only)

| Method | Path                  | Description          |
|--------|-----------------------|----------------------|
| GET    | /admin/users          | List all users       |
| GET    | /admin/users/{id}     | Get user by ID       |
| PATCH  | /admin/users/{id}     | Update role/status   |

---

## Security

- **Passwords**: hashed with bcrypt (12 rounds)
- **JWT**: RS256-style HS256 with access (60 min) + refresh (7 days) token pair
- **RBAC**: FastAPI `Depends` at route level — `CurrentUser`, `AdminUser`
- **Input validation**: Pydantic v2 field validators on all request schemas
- **Soft deletes**: tasks set `is_deleted=True`, never physically removed
- **Request tracing**: `X-Request-ID` header on every response

---

## Database Schema

```sql
users
  id, email (unique), username (unique), full_name,
  hashed_password, role (user|admin), is_active, created_at, updated_at

tasks
  id, title, description, status (todo|in_progress|done),
  priority (low|medium|high), due_date, is_deleted,
  owner_id → users.id, created_at, updated_at
```

Default: SQLite (dev). Switch to Postgres via env:
```
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
```

---

## Environment Variables

| Variable                    | Default                          |
|-----------------------------|----------------------------------|
| SECRET_KEY                  | changeme-... (override in prod!) |
| DATABASE_URL                | sqlite+aiosqlite:///./taskflow.db|
| ACCESS_TOKEN_EXPIRE_MINUTES | 60                               |
| REFRESH_TOKEN_EXPIRE_DAYS   | 7                                |
| ALLOWED_ORIGINS             | ["http://localhost:5173"]        |
| DEBUG                       | false                            |

---

## Running Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

13 integration tests covering auth, CRUD, RBAC, pagination, soft delete.

---

## Making an Admin User

Register normally, then in a Python shell or DB:

```python
from app.models.models import UserRole
# UPDATE users SET role='admin' WHERE email='you@example.com';
```

Or via PATCH `/admin/users/{id}` with `{"role": "admin"}` from an existing admin account.

---

## Database Migrations (Alembic)

Migrations are managed with Alembic. The initial schema migration is already generated.

```bash
cd backend

# Apply all migrations
alembic upgrade head

# Create a new migration after changing models
alembic revision --autogenerate -m "describe_change"

# Rollback one step
alembic downgrade -1
```

> **Dev shortcut:** The app also auto-creates tables on startup via `create_tables()` in `lifespan`. For production, use Alembic migrations exclusively and disable `create_tables()`.
