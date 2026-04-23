# Deploying TaskFlow to Render (Full Stack)

## What gets created

| Service | Type | URL |
|---|---|---|
| `taskflow-api` | Web Service (Python) | `https://taskflow-api.onrender.com` |
| `taskflow-ui` | Static Site (React) | `https://taskflow-ui.onrender.com` |
| `taskflow-db` | PostgreSQL database | internal |

---

## Step 1 — Push to GitHub

```bash
cd taskflow
git init
git add .
git commit -m "feat: TaskFlow full-stack app"
# Create repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

---

## Step 2 — Deploy on Render (Blueprint — one click)

1. Go to **[dashboard.render.com](https://dashboard.render.com)**
2. Click **New → Blueprint**
3. Connect GitHub → select the `taskflow` repo
4. Render detects `render.yaml` at root automatically
5. Click **Apply** → Render creates all three resources

Build takes ~3–5 minutes. Both services deploy in parallel.

---

## Step 3 — Verify

```bash
# Backend health
curl https://taskflow-api.onrender.com/health
# → {"status":"ok","version":"1.0.0"}

# Swagger docs (full API reference)
open https://taskflow-api.onrender.com/docs

# Frontend
open https://taskflow-ui.onrender.com
```

---

## What link to submit

| Purpose | URL |
|---|---|
| **Primary submission link** | `https://taskflow-ui.onrender.com` (live working app) |
| **API documentation** | `https://taskflow-api.onrender.com/docs` |
| **API base URL** | `https://taskflow-api.onrender.com/api/v1` |
| **GitHub repo** | `https://github.com/YOUR_USERNAME/taskflow` |

**Submit both:** the frontend URL for the live demo, and the `/docs` URL for the evaluator to test APIs directly.

---

## How the two services talk to each other

```
Browser → https://taskflow-ui.onrender.com  (Static Site)
              ↓  (VITE_API_URL set at build time)
         → https://taskflow-api.onrender.com/api/v1  (Web Service)
              ↓
         → PostgreSQL (internal Render network)
```

`VITE_API_URL=https://taskflow-api.onrender.com` is set in `render.yaml`
and baked into the React build at compile time. No proxy needed.

---

## CORS is pre-configured

`render.yaml` sets `ALLOWED_ORIGINS` on the backend to include
`https://taskflow-ui.onrender.com`, so cross-origin requests work
out of the box. If your service names differ (Render may append a suffix),
update `ALLOWED_ORIGINS` in the dashboard:

```
Dashboard → taskflow-api → Environment
→ ALLOWED_ORIGINS = ["https://your-actual-frontend-url.onrender.com"]
→ Save → service redeploys automatically
```

---

## Creating the first admin user

After deploy, register normally then promote via the DB or:

```bash
# Register
curl -X POST https://taskflow-api.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","username":"admin","full_name":"Admin","password":"AdminPass1"}'

# Then in Render → taskflow-db → PSQL Console:
UPDATE users SET role='admin' WHERE email='admin@example.com';
```

---

## Free tier limits

| Limit | Value |
|---|---|
| Web service cold start | ~30s after 15min idle |
| Free Postgres | 90 days, then expires |
| Static site | No limits |

**Fix cold starts:** Add a free cron at [cron-job.org](https://cron-job.org) →
`GET https://taskflow-api.onrender.com/health` every 10 minutes.

---

## Redeploying

```bash
git add . && git commit -m "update" && git push
# Render auto-redeploys both services on push to main
```
