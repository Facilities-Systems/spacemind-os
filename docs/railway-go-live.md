# SpaceMind OS — Railway Go-Live Checklist

> **Target:** Take a Railway deployment from "app exists" to "publicly accessible and fully operational" including PostgreSQL, Redis, Celery worker, and Celery beat.

---

## 0. Prerequisites

- [ ] Railway account at [railway.app](https://railway.app)
- [ ] GitHub repo connected to Railway project
- [ ] `railway.toml` present at repo root (already committed — uses `Dockerfile` builder + `start.sh`)
- [ ] Railway CLI installed: `npm install -g @railway/cli && railway login`

---

## 1. Create the Railway Project

```bash
# If starting fresh from CLI:
railway new spacemind-os
railway link   # link local repo to the project
```

Or via dashboard: **New Project → Deploy from GitHub repo → select `spacemind-os`**.

Railway will auto-detect `railway.toml` and use the root `Dockerfile`.

---

## 2. Add PostgreSQL Plugin

Dashboard: **Project → + New → Database → PostgreSQL**

Railway automatically injects `DATABASE_URL` into your service environment.
Reference it in other services as `${{Postgres.DATABASE_URL}}`.

```
# What Railway sets on the API service automatically:
DATABASE_URL=postgresql://spacemind:...@roundhouse.proxy.rlwy.net:PORT/railway
```

No manual connection string needed — Railway handles it.

---

## 3. Add Redis Plugin

Dashboard: **Project → + New → Database → Redis**

Railway injects `REDIS_URL`. You will reference it manually in the next step.

---

## 4. Set Environment Variables

Dashboard: **API service → Variables tab**

| Variable | Value | Notes |
|---|---|---|
| `APP_ENV` | `production` | Tightens CORS, disables debug output |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Your real Claude API key |
| `SECRET_KEY` | *(see below)* | JWT signing — must be 64+ chars |
| `CELERY_BROKER_URL` | `${{Redis.REDIS_URL}}` | Railway variable reference |
| `CELERY_RESULT_BACKEND` | `${{Redis.REDIS_URL}}` | Same Redis instance |
| `CORS_ORIGINS` | `https://<your-service>.up.railway.app` | Your Railway public URL (no trailing slash) |
| `SENTRY_DSN` | *(optional)* | Error tracking |

Generate a secure `SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
# or
openssl rand -hex 32
```

> `DATABASE_URL` is auto-injected by the PostgreSQL plugin — do not set it manually.

---

## 5. Verify Migrations Run Automatically

`start.sh` (already committed) runs `alembic upgrade head` before starting uvicorn:

```sh
# start.sh — already wired in railway.toml
alembic upgrade head          # ← runs every deploy
exec uvicorn spacemind.main:app --host 0.0.0.0 --port "${PORT}" ...
```

No extra steps needed. Migrations execute on every deploy; Alembic is idempotent — re-running does nothing if the schema is current.

To run migrations manually (e.g. after adding a plugin mid-flight):
```bash
railway run alembic upgrade head
# or in Railway dashboard → API service → Shell tab:
alembic upgrade head
```

---

## 6. Add Celery Worker Service

Celery needs a separate Railway service pointing at the same repo but with a different start command.

**Dashboard: Project → + New → GitHub Repo → same repo**

Configure the new service:

| Setting | Value |
|---|---|
| **Service name** | `celery-worker` |
| **Root directory** | `backend` |
| **Build command** | *(leave blank — uses Dockerfile)* |
| **Start command** | `celery -A spacemind.workers.celery_app worker --loglevel=info --concurrency=2` |

**Variables** (copy from API service or add individually):

```
APP_ENV=production
ANTHROPIC_API_KEY=<same key>
SECRET_KEY=<same key>
DATABASE_URL=${{Postgres.DATABASE_URL}}
CELERY_BROKER_URL=${{Redis.REDIS_URL}}
CELERY_RESULT_BACKEND=${{Redis.REDIS_URL}}
```

> The worker needs `DATABASE_URL` because tasks write `AuditLog` entries directly to PostgreSQL.

---

## 7. Add Celery Beat Service

Same process as the worker — a third Railway service.

**Dashboard: Project → + New → GitHub Repo → same repo**

| Setting | Value |
|---|---|
| **Service name** | `celery-beat` |
| **Root directory** | `backend` |
| **Start command** | `celery -A spacemind.workers.celery_app beat --loglevel=info --scheduler celery.beat.PersistentScheduler` |

**Variables:** identical to the worker above.

> Beat runs the daily cron schedule: maintenance check at 06:00, medical expiry check at 06:05. Only one instance of beat should ever run — Railway's single-replica default is correct here.

---

## 8. Update CORS After First Deploy

After Railway assigns a public URL (e.g. `https://spacemind-os-production.up.railway.app`):

1. Copy the URL from **API service → Settings → Public Networking**
2. Update `CORS_ORIGINS` in the API service variables — exact URL, no trailing slash
3. Railway redeploys automatically

If you later add a custom domain:
```
CORS_ORIGINS=https://spacemind-os-production.up.railway.app,https://app.yourdomain.com
```

---

## 9. Create the First Admin User

The registration endpoint defaults new users to `viewer` role. Promote one user to `admin` via Railway Shell.

**Dashboard: API service → Shell tab**

```python
python - <<'EOF'
from spacemind.db.session import SessionLocal
from spacemind.models.user import User
from spacemind.core.security import hash_password
import uuid, os

db = SessionLocal()
user = User(
    id=str(uuid.uuid4()),
    email="admin@yourcompany.com",
    full_name="SpaceMind Admin",
    hashed_password=hash_password("ChangeMe123!"),
    role="admin",
    is_active=True,
)
db.add(user)
db.commit()
print(f"Admin created: {user.email}")
db.close()
EOF
```

Or register via the UI (`/login → Create Account`) then promote via shell:
```python
u = db.query(User).filter_by(email="you@yourco.com").first()
u.role = "admin"
db.commit()
```

---

## 10. Custom Domain (Optional)

1. Dashboard: **API service → Settings → Public Networking → + Custom Domain**
2. Add `app.yourdomain.com`
3. Copy the CNAME target Railway shows
4. In your DNS provider: add `CNAME app → <railway-cname-target>`
5. Railway provisions TLS automatically (Let's Encrypt)
6. Update `CORS_ORIGINS` to include the new domain

---

## 11. Smoke Test Checklist

Run these after all four services (API, PostgreSQL, Redis, celery-worker, celery-beat) show **Active** in the Railway dashboard.

- [ ] `GET https://<your-url>/api/v1/health` → `{"status": "operational"}`
- [ ] Landing page loads at `https://<your-url>/`
- [ ] Register a new account → login succeeds
- [ ] Submit a decomposition request → AI response returned
- [ ] Deep Analysis toggle → 5-agent orchestration completes
- [ ] Global search (`Ctrl+K`) → results appear
- [ ] Export plan as PDF → valid file downloaded
- [ ] Railway logs for `celery-worker` → no errors on startup
- [ ] Railway logs for `celery-beat` → `beat: Starting...` and first schedule logged

---

## 12. Trigger Background Jobs Manually (Admin)

Verify jobs work without waiting until 06:00:

```bash
# Maintenance check
curl -X POST https://<your-url>/api/v1/admin/trigger-maintenance-check \
  -H "Authorization: Bearer <admin-jwt-token>"

# Medical expiry check (30-day window)
curl -X POST "https://<your-url>/api/v1/admin/trigger-medical-expiry?days_ahead=30" \
  -H "Authorization: Bearer <admin-jwt-token>"
```

Expected response: JSON summary of checked items and any alerts logged to `AuditLog`.

---

## 13. Post-Go-Live Monitoring

| What | Where |
|---|---|
| Real-time logs | Railway dashboard → service → **Logs** tab |
| Celery task results | Redis — `railway run redis-cli monitor` |
| Error tracking | Sentry (if `SENTRY_DSN` set) — alerts on first exception |
| API metrics | `GET /metrics` — Prometheus scrape endpoint |
| Health check | `GET /api/v1/health` — Railway uses this for restart policy |

---

## 14. Required Services Summary

| Railway Service | Image / Source | Start Command |
|---|---|---|
| **API** (main) | Repo root `Dockerfile` | `start.sh` (migrations + uvicorn) |
| **PostgreSQL** | Railway plugin | Managed |
| **Redis** | Railway plugin | Managed |
| **celery-worker** | `backend/` Dockerfile | `celery ... worker --concurrency=2` |
| **celery-beat** | `backend/` Dockerfile | `celery ... beat --scheduler PersistentScheduler` |

---

## 15. Environment Variables Quick-Reference

```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# Set all variables at once via CLI
railway variables set \
  APP_ENV=production \
  ANTHROPIC_API_KEY=sk-ant-api03-... \
  SECRET_KEY=<generated-above> \
  CELERY_BROKER_URL='${{Redis.REDIS_URL}}' \
  CELERY_RESULT_BACKEND='${{Redis.REDIS_URL}}' \
  CORS_ORIGINS=https://<your-service>.up.railway.app
```

> `DATABASE_URL` is auto-injected by the PostgreSQL plugin — omit from manual `set` commands.
