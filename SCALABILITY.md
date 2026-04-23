# TaskFlow — Scalability & Deployment Notes

## Current Architecture

```
Client → Nginx → FastAPI (uvicorn workers) → PostgreSQL
                                           ↗ Redis (optional)
```

Single-instance, horizontally scalable from day one due to:
- **Stateless JWT auth** — no server-side sessions
- **Async SQLAlchemy** — non-blocking DB I/O throughout
- **12-factor config** — all secrets via env vars

---

## Scaling Paths

### 1. Horizontal Scaling (immediate)

Since JWTs are stateless, multiple FastAPI instances work out of the box:

```
                    ┌─ FastAPI instance 1 ─┐
Client → Load Balancer (Nginx/Traefik)     ├─ PostgreSQL (shared)
                    └─ FastAPI instance 2 ─┘
```

Scale with Docker Swarm or Kubernetes replicas. No shared state issues.

### 2. Caching (Redis)

Add Upstash Redis or self-hosted Redis for:

- **Token denylist** — currently logout is client-side only; Redis enables server-side revocation in O(1)
- **Response caching** — cache `/tasks/` list per user with short TTL (5s) to reduce DB load under high read traffic
- **Rate limiting** — per-user or per-IP request limits using Redis sliding window

```python
# Example: token denylist on logout
await redis.setex(f"revoked:{jti}", ACCESS_TOKEN_EXPIRE_MINUTES * 60, "1")
```

### 3. Database Scaling

**Read replicas** — SQLAlchemy supports multiple engines; route `SELECT` queries to replicas:

```python
read_engine = create_async_engine(READ_REPLICA_URL)
write_engine = create_async_engine(PRIMARY_URL)
```

**Connection pooling** — Switch from SQLite to PostgreSQL + PgBouncer in transaction mode for 10k+ concurrent connections.

**Indexes** — Already have: `users.email`, `users.username`, `tasks.owner_id`. Add composite index for sorted filtered queries:

```sql
CREATE INDEX idx_tasks_owner_status ON tasks(owner_id, status, created_at DESC);
```

### 4. Microservices Path

When task volume or team size justifies it, split into:

```
auth-service      → handles register/login/refresh, issues JWTs
task-service      → CRUD for tasks, validates JWT locally
notification-svc  → async worker for due-date reminders (Celery + Redis)
admin-service     → user management, audit logs
```

Inter-service communication: REST (sync) or message queue (async) via RabbitMQ/Kafka.

### 5. Async Task Queue

For heavy operations (email notifications, bulk exports, webhooks):

```
FastAPI → Celery (worker) → Redis (broker) → PostgreSQL (results)
```

### 6. Observability

Add structured logging + tracing before scaling:

```python
# Each request already has X-Request-ID via middleware
# Add to every log line for correlation
import structlog
log = structlog.get_logger().bind(request_id=request.state.request_id)
```

Tools: **OpenTelemetry** → Jaeger (tracing), **Prometheus** → Grafana (metrics), **Loki** (logs).

---

## Deployment Targets

| Target         | Command / Notes                              |
|----------------|----------------------------------------------|
| Local dev      | `uvicorn app.main:app --reload`             |
| Docker         | `docker-compose up --build`                 |
| Railway        | `railway up` — auto-detects Dockerfile      |
| Render         | Connect repo, set env vars, deploy           |
| AWS ECS        | Push image to ECR, use Fargate task def      |
| Kubernetes     | `kubectl apply -f k8s/` (add manifests)     |

For production PostgreSQL: Supabase, Neon, or AWS RDS — just update `DATABASE_URL`.

---

## Load Estimate (single instance)

| Metric            | Estimate                    |
|-------------------|-----------------------------|
| Concurrent users  | ~500 with 4 uvicorn workers |
| Requests/sec      | ~200 rps (CPU-bound at bcrypt) |
| DB connections    | 10 (SQLAlchemy pool default) |
| Bottleneck        | bcrypt on register/login (~100ms) |

**Immediate fix for auth bottleneck**: run bcrypt in a thread pool (`asyncio.to_thread`) to avoid blocking the event loop during high-traffic login spikes.
