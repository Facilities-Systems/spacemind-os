# SpaceMind OS — Deployment Guide

## Quick Reference

| Method | Best For | Cost |
|--------|----------|------|
| Docker Compose (local) | Dev / staging | Free |
| Fly.io | Production MVP | ~$10–20/month |
| Railway | Alternative PaaS | ~$5–15/month |
| Self-hosted | Enterprise | Own infra |

---

## 1. Local Development

```bash
# Clone and setup
git clone https://github.com/SifisoScS/spacemind-os.git
cd spacemind-os

# Configure
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY and SECRET_KEY

# Run (SQLite by default)
pip install -r requirements.txt
alembic upgrade head
uvicorn spacemind.main:app --reload

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

---

## 2. Docker Compose (Staging)

```bash
# Full stack: FastAPI + PostgreSQL + Nginx/React
docker compose up --build -d

# Run migrations
docker compose exec api alembic upgrade head

# Access
# Frontend: http://localhost:5173
# API docs: http://localhost:8000/docs
```

---

## 3. Production — Fly.io (Recommended)

### Prerequisites
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login
```

### First deployment

```bash
# Create the app (one-time)
flyctl launch --no-deploy --name spacemind-os-api

# Create persistent volume for ChromaDB + SQLite fallback
flyctl volumes create spacemind_data --region jnb --size 1

# Provision managed PostgreSQL (Neon or Supabase — external)
# Then set DATABASE_URL to your managed DB connection string

# Set all secrets
flyctl secrets set \
  ANTHROPIC_API_KEY="sk-ant-..." \
  SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_hex(32))')" \
  DATABASE_URL="postgresql+psycopg2://user:pass@host:5432/spacemind" \
  APP_ENV="production"

# Optional: Sentry
flyctl secrets set SENTRY_DSN="https://..."

# Deploy
flyctl deploy

# Run migrations
flyctl ssh console --command "alembic upgrade head"

# Check health
curl https://spacemind-os-api.fly.dev/api/v1/health
```

### Subsequent deploys

```bash
flyctl deploy
```

### Scaling

```bash
# Scale to 2 instances
flyctl scale count 2

# Monitor
flyctl status
flyctl logs
```

---

## 4. Production — Railway (Alternative)

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# New project
railway new spacemind-os

# Add PostgreSQL plugin via Railway dashboard, then:
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')

# Deploy
railway up

# Run migrations
railway run alembic upgrade head
```

---

## 5. Managed PostgreSQL Options

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **Neon** | 0.5 GB | Serverless, scales to zero |
| **Supabase** | 500 MB | Good dashboard, REST API included |
| **Railway** | 100 MB | Integrated into Railway deploys |
| **Fly Postgres** | Paid | Co-located — lowest latency on Fly |

**Recommended connection string format:**
```
postgresql+psycopg2://user:password@host:5432/spacemind?sslmode=require
```

---

## 6. Required Secrets (Production)

| Variable | Required | Notes |
|----------|----------|-------|
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `SECRET_KEY` | ✅ | JWT signing — 64+ hex chars |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `APP_ENV` | ✅ | Set to `production` |
| `SENTRY_DSN` | Optional | Error tracking |
| `ENABLE_VECTOR_MEMORY` | Optional | Requires chromadb |
| `ENABLE_MULTI_AGENT` | Optional | Parallel specialist agents |

---

## 7. Post-Deployment Checklist

- [ ] `curl https://your-app.fly.dev/api/v1/health` returns `{"status":"operational"}`
- [ ] Register first user via `POST /auth/register`
- [ ] Submit a test decomposition request
- [ ] Verify PDF export works
- [ ] Check Sentry dashboard for any startup errors
- [ ] Review Prometheus metrics at `/metrics` (internal only)
- [ ] Set `SECRET_KEY` to a fresh 64-char hex string (not the default)
- [ ] Confirm `APP_ENV=production` (tightens CORS, disables debug)
- [ ] Rotate `ANTHROPIC_API_KEY` if it was used in development

---

## 8. Monitoring

### Prometheus + Grafana (self-hosted)
```bash
docker compose -f docker-compose.prod.yml up prometheus -d
# Then add Grafana and import FastAPI dashboard ID: 14981
```

### Fly.io built-in metrics
```bash
flyctl dashboard metrics
```

### Logs
```bash
# Fly
flyctl logs --tail

# Docker
docker compose logs -f api
```
