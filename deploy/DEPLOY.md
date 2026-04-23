# Deployment Guide

## Option A — Railway (recommended, your stack)

**One-time setup:**
```bash
npm install -g @railway/cli
railway login
railway init          # link to project
```

**Deploy backend:**
```bash
cd taskflow
railway up --service backend
railway variables set SECRET_KEY=$(openssl rand -hex 32)
railway variables set DATABASE_URL=${{ Postgres.DATABASE_URL }}
railway variables set ALLOWED_ORIGINS='["https://your-frontend.up.railway.app"]'
railway variables set ENVIRONMENT=production
```

**Add Postgres:**
```
Railway dashboard → New Service → Database → PostgreSQL
```

**Deploy frontend:**
```bash
railway up --service frontend
```

**First deploy runs:**
```
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Option B — Render

```bash
# Push to GitHub first, then:
# render.com → New → Blueprint → connect repo → render.yaml auto-detected
```

---

## Option C — Local Docker (once you have Docker)

```bash
cd taskflow
SECRET_KEY=$(openssl rand -hex 32) docker-compose up --build
```

Services:
- API:      http://localhost:8000
- Swagger:  http://localhost:8000/docs
- Frontend: http://localhost:5173
- Postgres: localhost:5432

---

## Option D — Bare VPS / EC2

```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
SECRET_KEY=<strong-secret> DATABASE_URL=postgresql+asyncpg://... \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend (build and serve via nginx)
cd frontend
npm install && npm run build
# copy dist/ to nginx webroot
```

---

## Environment Variables (required in production)

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing key — generate with `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL: `postgresql+asyncpg://user:pass@host/db` |
| `ALLOWED_ORIGINS` | JSON array of allowed frontend origins |
| `ENVIRONMENT` | `production` |
| `DEBUG` | `false` |
