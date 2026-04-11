# SpaceMind OS — Roadmap to World Class + Production

## Context

SpaceMind OS has a solid Phase 1 MVP: the core AI decomposition pipeline works end-to-end, 5 knowledge templates are built, the FastAPI backend and React frontend are wired up. However, the system is ~75% backend / ~35% frontend complete — not yet deployable to production without security, reliability, and UX gaps addressed.

This roadmap tracks the sequenced path from MVP to world-class, production-grade Facilities Intelligence System.

**Legend:** ✅ Done &nbsp;·&nbsp; 🔲 To do

---

## Current State (Audit Summary)

**Backend strengths:** Clean architecture, strong domain models, YAML templates with real FM knowledge, Ceiling→Walls→Floor rules engine, Claude Sonnet/Haiku two-stage classifier.

**Backend gaps:** No auth, CORS `*`, no rate limiting, fragile error handling, 20% test coverage, no token tracking, missing templates for `vendor_coordination` and `space_change`.

**Frontend strengths:** TypeScript strict mode, React Query, clean component structure, dark design system.

**Frontend gaps:** No auth, no error boundary, no toast system, no form validation, no search/filter, no pagination controls, no mobile responsiveness, non-functional search/bell buttons in header.

---

## Phase 1.1 — Robustness & Foundation
*Unblocks everything else.*

### Backend

- ✅ **1. Missing knowledge templates**
  - Add `space_change.yaml` (partitions, layout reconfigurations)
  - Add `vendor_coordination.yaml` (procurement, tendering, SLA management)
  - Files: `src/spacemind/knowledge/templates/`

- ✅ **2. Error handling hardening**
  - Define custom exception types: `AIError`, `DecompositionError`, `ValidationError`
  - Wrap AI client calls to never leak raw AI output in HTTP 500 responses
  - Add try/except in repository (catch SQLAlchemy errors, re-raise clean)
  - Files: `src/spacemind/ai/client.py`, `src/spacemind/api/routes.py`, `src/spacemind/storage/repository.py`

- ✅ **3. Token usage tracking**
  - Log input/output token counts from every Claude API response
  - Store token usage in `DecompositionRecord` (in `result_json` or dedicated columns)
  - Files: `src/spacemind/ai/client.py`, `src/spacemind/domain/models.py`

- ✅ **4. Request/response logging middleware**
  - FastAPI middleware: method, path, status code, duration, correlation ID
  - File: `src/spacemind/main.py`

- ✅ **5. Rate limiting**
  - Add `slowapi` for per-IP rate limiting on `/decompose` (10 req/min, configurable)
  - Files: `src/spacemind/api/routes.py`, `requirements.txt`

- ✅ **6. Alembic migrations setup**
  - Alembic is in `requirements.txt` but not configured — initialize and create baseline migration
  - Files: `alembic/`, `alembic.ini`

- ✅ **7. Test coverage — unit (backend)**
  - AIClient: mock Anthropic SDK, test retry logic, JSON parsing
  - Decomposer: mock AIClient, test full pipeline
  - Validator: all validation paths
  - Rules engine: landlord flagging, sequencing enforcement
  - Repository: save/get/list with SQLite in-memory
  - Files: `tests/unit/test_ai_client.py`, `test_decomposer.py`, `test_validator.py`, `test_repository.py`

- ✅ **8. History search/filter API**
  - Add query params to `GET /history`: `?request_type=`, `?location_id=`, `?priority=`, `?from_date=`, `?to_date=`
  - Files: `src/spacemind/api/routes.py`, `src/spacemind/storage/repository.py`

### Frontend

- ✅ **9. Error boundary**
  - React `ErrorBoundary` wrapping `<Layout>` — friendly error page with retry
  - Files: `frontend/src/components/ui/ErrorBoundary.tsx`, `frontend/src/components/layout/Layout.tsx`

- ✅ **10. Toast notification system**
  - Install `react-hot-toast`, add `<Toaster>` to `App.tsx`
  - Success toast after decompose, error toast on failure
  - Files: `frontend/src/App.tsx`, `frontend/src/pages/DecomposePage.tsx`

- ✅ **11. Form validation (Zod)**
  - Install `zod` + `react-hook-form`
  - Field-level validation on `RequestForm` (min 10 chars, required location)
  - File: `frontend/src/components/decompose/RequestForm.tsx`

- ✅ **12. Pagination UI for History**
  - Previous/Next controls wired to `offset` param in `useHistory(limit, offset)`
  - File: `frontend/src/pages/HistoryPage.tsx`

- ✅ **13. Search and filter on History**
  - Filter bar: request type dropdown, location dropdown, date range pickers
  - Wire to new backend query params (item 8)
  - Files: `frontend/src/pages/HistoryPage.tsx`, `frontend/src/hooks/useDecompose.ts`

---

## Phase 1.2 — Auth, UX Polish & Export

- ✅ **14. Authentication — Backend**
  - JWT auth with `python-jose` + `passlib`
  - `POST /auth/login` → access token
  - Protect all `/api/v1/` routes with `Depends(get_current_user)`
  - Files: `src/spacemind/api/auth.py`, `src/spacemind/domain/models.py` (User model), `src/spacemind/storage/repository.py`

- ✅ **15. Authentication — Frontend**
  - `LoginPage` (email + password + register tab)
  - `AuthContext` with JWT token (localStorage), auto-logout on 401
  - `ProtectedRoute` wrapper; user identity in `Header.tsx` (initials, name, role, logout)
  - Files: `frontend/src/pages/LoginPage.tsx`, `frontend/src/context/AuthContext.tsx`, `frontend/src/api/client.ts`

- ✅ **16. PDF / Export**
  - Backend: `GET /api/v1/history/{id}/export?format=pdf|json|markdown`
  - PDF via `reportlab` (multi-table, risk colours, branded layout)
  - Frontend: Export dropdown in `ResultView.tsx` (PDF / JSON / Markdown)
  - Files: `src/spacemind/api/routes.py`, `src/spacemind/services/export_service.py`

- ✅ **17. Gantt Chart / Timeline visualization**
  - "Timeline" tab in `ResultView` — visual Gantt from `estimated_duration_hours`, task micro-bars by risk colour, detail table below
  - File: `frontend/src/components/decompose/GanttChart.tsx`, `frontend/src/components/decompose/ResultView.tsx`

- ✅ **18. Task Status Tracking**
  - Backend: `PATCH /api/v1/history/{id}/tasks/{task_id}` → update task status in stored JSON
  - Frontend: Status toggle buttons on `TaskRow.tsx` (Pending / In Progress / Completed / Blocked)
  - Files: `src/spacemind/api/routes.py`, `src/spacemind/storage/repository.py`, `frontend/src/components/decompose/TaskRow.tsx`

- ✅ **19. Mobile Responsive Design**
  - Sidebar collapses to hamburger on `< md` breakpoint, overlay slide-out drawer
  - Mobile top bar with hamburger + logo; paddings stack on small screens
  - Files: `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/components/layout/Layout.tsx`

- ✅ **20. Analytics Dashboard**
  - Requests by type + priority bar charts (`recharts`)
  - Backend: `GET /api/v1/analytics` — totals, by_type, by_priority, avg_tasks, avg_days
  - Files: `frontend/src/pages/DashboardPage.tsx`, `src/spacemind/api/routes.py`, `src/spacemind/storage/repository.py`

---

## Phase 2 — Multi-Agent Intelligence

- ✅ **21. Multi-agent orchestration** (native Anthropic SDK, no CrewAI dependency)
  - Supervisor (Haiku) → [Operations Planner + Technical Specialist + Vendor Coordinator] parallel (ThreadPoolExecutor) → Synthesizer
  - 5 specialist prompts in `prompts.py`, 5 agent classes in `src/spacemind/ai/agents/`
  - `POST /api/v1/orchestrate` endpoint — rate-limited, auth-protected
  - Frontend: Deep Analysis Mode toggle in RequestForm — purple UI, 5-agent loading state
  - Files: `src/spacemind/engine/planner.py`, `src/spacemind/services/orchestration_service.py`, `src/spacemind/ai/agents/`

- ✅ **22. Vector memory store**
  - ChromaDB persistent store at `./data/chromadb/`
  - Lazy singleton — only initialised when `ENABLE_VECTOR_MEMORY=true`
  - Upsert embeddings on every save; query top-3 similar cases injected into AI context
  - Files: `src/spacemind/storage/vector_store.py`

- ✅ **23. Country compliance rules engine**
  - Structured `ComplianceRule` dataclass with `applies_to` + `tenure_required` filtering
  - Countries: South Africa (OHS Act, SANS 10142, NBR, COIDA, B-BBEE), UK (CDM 2015, Part B, BS 7671, Asbestos Regs), Kenya (NEMA, NCA, KEBS), Nigeria (LASPPPA, LAWMA, COREN)
  - Auto-injected into `compliance_notes` after every decomposition via `_inject_compliance_notes()`
  - Files: `src/spacemind/knowledge/compliance.py`, `src/spacemind/knowledge/rules.py`

---

## Phase 3 — Production Deployment

- ✅ **24. CI/CD Pipeline**
  - `.github/workflows/ci.yml`: pytest + tsc --noEmit + eslint + Docker build check on every PR
  - `.github/workflows/deploy.yml`: build + push to GHCR, Alembic migrate, Fly.io deploy + health check on merge to main
  - Files: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`

- ✅ **25. Production Docker hardening**
  - Multi-stage `Dockerfile` (builder → python:3.11-slim runtime, non-root uid=1001, curl health check)
  - `docker-compose.prod.yml`: replicas=2, rolling update, health checks, resource limits, migration job, Prometheus
  - Hardened `nginx.conf`: gzip, security headers (X-Frame-Options, HSTS, CSP), 180s AI proxy timeout, /metrics blocked externally
  - Files: `Dockerfile`, `docker-compose.prod.yml`, `frontend/nginx.conf`

- ✅ **26. Observability**
  - Prometheus metrics at `/metrics` via `prometheus-fastapi-instrumentator` (lazy-loaded, disabled if not installed)
  - Sentry backend: FastAPI + SQLAlchemy integrations, 10% trace sampling in prod, PII scrubbed
  - Sentry frontend: dynamic import (zero bundle cost when DSN not set), Authorization header scrubbed
  - Structured request logs: correlation_id, method, path, status_code, duration_ms, client_ip as log `extra`
  - Files: `src/spacemind/main.py`, `requirements.txt`, `frontend/src/main.tsx`, `monitoring/prometheus.yml`

- ✅ **27. Cloud deployment**
  - `fly.toml`: app=spacemind-os-api, region=jnb, persistent volume, HTTP health check, Fly metrics
  - `docs/deployment.md`: step-by-step for Fly.io, Railway, local Docker, managed PostgreSQL options (Neon/Supabase/Railway)
  - Production checklist: 9-item post-deploy verification

---

## Phase 4 — Philosophy Adoption from UFM (Legacy Project)

> **After all above phases are complete**, we revisit the Universal Facilities Manager project
> at `C:\Users\sifis\Next-Level-Projects\Facilities 4 Production\derivco-stores-infrastructure-admin`
> and adopt proven patterns that can elevate SpaceMind OS further.

- ✅ **28. RBAC — Role-based access control**
  - `require_role(*roles)` dependency factory in `auth.py` using a 4-level hierarchy: `viewer(0) → technician(1) → facilities_manager(2) → admin(3)`
  - `/decompose` + `/orchestrate` require `facilities_manager` or `admin`
  - `/history/{id}/tasks/{task_id}` PATCH requires `technician` or above
  - All other protected routes require any authenticated user

- ✅ **29. Audit log model**
  - `AuditLog` ORM model: `id`, `created_at`, `user_id`, `user_email`, `action`, `resource_type`, `resource_id`, `details` (JSON)
  - `AuditService.log()` — never raises, wraps all write failures as warnings
  - Called on: `decomposition.created` (single + multi-agent), `task.status.updated`
  - Files: `src/spacemind/domain/models.py`, `src/spacemind/services/audit_service.py`, `src/spacemind/api/router_decompose.py`, `src/spacemind/api/router_history.py`

- ✅ **30. Custom exception hierarchy**
  - `SpaceMindError` base → `AIError`, `DecompositionError`, `ValidationError`, `LocationError`, `TemplateError`
  - All exceptions carry `http_status` and `message` — routes catch `SpaceMindError` and return clean HTTP responses, no raw AI output leaks
  - File: `src/spacemind/core/exceptions.py`

- ✅ **31. Thread-safe operation locking**
  - Per-decomposition `threading.RLock` in the repository (`_resource_locks` dict, `_get_lock()` helper)
  - `update_result_json()` wrapped with `with _get_lock(decomposition_id):` to prevent read-modify-write races
  - File: `src/spacemind/storage/repository.py`

- ✅ **32. In-memory TTL cache**
  - `TTLCache` class: thread-safe (`threading.Lock`), `get/set/delete/clear` + `@cached(key)` decorator
  - `locations_cache` (TTL=600s) for `/locations`, `analytics_cache` (TTL=120s) for `/analytics`
  - Files: `src/spacemind/utils/cache.py`, `src/spacemind/utils/location_context.py`, `src/spacemind/services/decomposition_service.py`

- ✅ **33. Validation-first pattern**
  - Centralised `src/spacemind/core/validators.py` — all validation lives here, routes and services call validators at system boundaries
  - Validators: `validate_request_text`, `validate_location_id`, `validate_priority`, `validate_date_filter`, `validate_task_status`, `validate_export_format`, `validate_decomposition_request`
  - File: `src/spacemind/core/validators.py`

- ✅ **34. Excel import/export pipeline**
  - `ExportService.to_excel()` — `pandas` + `openpyxl`, 5-sheet workbook: Summary, Tasks, Risks, Compliance, Recommendations
  - Dark header styling (`#1E293B` fill, white bold font), auto-fit column widths (max 60)
  - `GET /history/{id}/export?format=excel` → `Content-Type: application/vnd.openxmlformats...`, `.xlsx` download
  - Frontend export dropdown: PDF / EXCEL / JSON / Markdown
  - Files: `src/spacemind/services/export_service.py`, `src/spacemind/api/router_export.py`, `frontend/src/components/decompose/ResultView.tsx`

- ✅ **35. Domain-split route organisation**
  - Replaced monolithic `routes.py` with 4 domain routers + 1 utility router:
    - `router_decompose.py` — POST /decompose, POST /orchestrate (RBAC + AuditLog)
    - `router_history.py` — GET /history, GET /history/{id}, PATCH /history/{id}/tasks/{task_id} (RBAC + AuditLog)
    - `router_export.py` — GET /history/{id}/export (all formats including Excel)
    - `router_analytics.py` — GET /analytics
    - `routes.py` — GET /health, GET /locations (open, no auth)
  - `main.py` includes each router independently

---

## Recommended Build Order

```
Week 1:   Items 1–8   — Backend robustness (templates, errors, rate limit, migrations, tests)
Week 2:   Items 9–13  — Frontend foundation (error boundary, toasts, validation, pagination, search)
Week 3:   Items 14–16 — Auth + PDF export
Week 4:   Items 17–20 — Gantt, task tracking, mobile, analytics
Week 5–7: Items 21–23 — Multi-agent Phase 2
Week 8:   Items 24–27 — CI/CD + production deployment
Week 9+:  Items 28–35 — UFM philosophy adoption
```

---

## Verification Checklist

- [ ] `pytest tests/ -v` — all backend unit tests pass
- [ ] `cd frontend && npx tsc --noEmit` — zero TypeScript errors
- [ ] `cd frontend && npm run lint` — zero ESLint errors
- [ ] Submit "Move 40 staff from FP1 to FP2" → 6-phase plan returned
- [ ] Mark a task as `completed` → persists on page refresh
- [ ] Export plan as PDF → valid PDF downloaded
- [ ] Hit `/decompose` 11× in 60s → 429 on 11th request
- [ ] Access `/decompose` without token → 401 Unauthorized
- [ ] Login → token stored → request succeeds
- [ ] Sidebar collapses at 768px width → hamburger menu works
- [ ] History filter by `request_type=office_move` → only office moves returned
