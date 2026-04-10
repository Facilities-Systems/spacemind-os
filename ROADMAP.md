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

- 🔲 **14. Authentication — Backend**
  - JWT auth with `python-jose` + `passlib`
  - `POST /auth/login` → access token
  - Protect all `/api/v1/` routes with `Depends(get_current_user)`
  - Files: `src/spacemind/api/auth.py`, `src/spacemind/domain/models.py` (User model), `src/spacemind/storage/repository.py`

- 🔲 **15. Authentication — Frontend**
  - `LoginPage` (email + password)
  - `AuthContext` with JWT token (httpOnly cookie preferred)
  - `ProtectedRoute` wrapper; user identity in `Header.tsx` (replace hardcoded "FM")
  - Files: `frontend/src/pages/LoginPage.tsx`, `frontend/src/context/AuthContext.tsx`, `frontend/src/api/client.ts`

- 🔲 **16. PDF / Export**
  - Backend: `GET /api/v1/history/{id}/export?format=pdf|json|markdown`
  - Use `weasyprint` for PDF generation
  - Frontend: Export button in `ResultView.tsx`
  - Files: `src/spacemind/api/routes.py`, `src/spacemind/services/export_service.py`

- 🔲 **17. Gantt Chart / Timeline visualization**
  - "Timeline" tab in `ResultView` — visual Gantt derived from `estimated_duration_hours` and dependencies
  - File: `frontend/src/components/decompose/GanttView.tsx`, `frontend/src/components/decompose/ResultView.tsx`

- 🔲 **18. Task Status Tracking**
  - Backend: `PATCH /api/v1/history/{id}/tasks/{task_id}` → update task status
  - Frontend: Status toggle buttons on `TaskRow.tsx`
  - Files: `src/spacemind/api/routes.py`, `src/spacemind/storage/repository.py`, `frontend/src/components/decompose/TaskRow.tsx`

- 🔲 **19. Mobile Responsive Design**
  - Sidebar collapses to hamburger on `< md` breakpoint, slide-out drawer
  - Stack form fields and cards on small screens
  - Files: `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/components/layout/Layout.tsx`

- 🔲 **20. Analytics Dashboard**
  - Requests by type (pie), average duration by type, requests over time (line)
  - Backend: `GET /api/v1/analytics`
  - Use `recharts` for charts
  - Files: `frontend/src/pages/DashboardPage.tsx`, `src/spacemind/api/routes.py`

---

## Phase 2 — Multi-Agent Intelligence

- 🔲 **21. CrewAI multi-agent orchestration**
  - Implement `src/spacemind/engine/planner.py` (currently a stub)
  - Supervisor Agent → Operations Planner + Technical Specialist + Context + Vendor Coordinator → Synthesizer
  - Install: `crewai`, `chromadb`, `langchain-community`
  - Files: `src/spacemind/engine/planner.py`, `src/spacemind/services/orchestration_service.py`, `src/spacemind/ai/agents/`

- 🔲 **22. Vector memory store**
  - Enable `enable_vector_memory=true` feature flag (currently stubbed)
  - Embed past decompositions into ChromaDB on save; retrieve semantically similar cases for AI context
  - Files: `src/spacemind/storage/vector_store.py`, `src/spacemind/ai/client.py`

- 🔲 **23. Country compliance rules engine**
  - Expand `rules.py` from keyword flagging to structured country-specific rules
  - SA: OHS Act, SANS 10142. UK: Building Regs Part B, CDM 2015. Kenya: NEMA, KEBS
  - Files: `src/spacemind/knowledge/rules.py`, `src/spacemind/core/constants.py`

---

## Phase 3 — Production Deployment

- 🔲 **24. CI/CD Pipeline**
  - `.github/workflows/ci.yml`: `pytest`, `eslint`, `tsc --noEmit` on every PR
  - `.github/workflows/deploy.yml`: build Docker images, push, deploy on merge to `main`
  - Files: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`

- 🔲 **25. Production Docker hardening**
  - Multi-stage Dockerfile (builder → slim runtime), non-root user, health checks
  - Separate `docker-compose.prod.yml`
  - Files: `Dockerfile`, `docker-compose.prod.yml`

- 🔲 **26. Observability**
  - `prometheus-fastapi-instrumentator` for `/metrics`
  - Sentry SDK for error tracking (backend + frontend)
  - Structured logging with correlation IDs threaded through every request
  - Files: `src/spacemind/main.py`, `requirements.txt`, `frontend/src/main.tsx`

- 🔲 **27. Cloud deployment**
  - Deploy to Fly.io (fast, cost-effective for MVP) or Railway
  - `DATABASE_URL` → managed PostgreSQL (Neon or Supabase)
  - Add `fly.toml` and deployment guide in `docs/`

---

## Phase 4 — Philosophy Adoption from UFM (Legacy Project)

> **After all above phases are complete**, we revisit the Universal Facilities Manager project
> at `C:\Users\sifis\Next-Level-Projects\Facilities 4 Production\derivco-stores-infrastructure-admin`
> and adopt proven patterns that can elevate SpaceMind OS further.

- 🔲 **28. RBAC — Role-based access control**
  - UFM uses a `@require_role` decorator pattern with JWT claims
  - Adopt this for SpaceMind OS: `facilities_manager`, `technician`, `viewer`, `admin` roles
  - Some routes (decompose, export) gated by role

- 🔲 **29. Audit log model**
  - UFM has a dedicated `AuditLog` ORM model tracking every write operation with user, timestamp, action, and before/after state
  - Add this to SpaceMind OS — every decomposition, task status change, and export gets an audit record

- 🔲 **30. Custom exception hierarchy**
  - UFM defines `UFMBaseError` subclasses mapped to specific HTTP response codes
  - Apply same pattern to SpaceMind OS: `SpaceMindError` → `AIError`, `DecompositionError`, `LocationError`, `TemplateError`

- 🔲 **31. Thread-safe operation locking**
  - UFM uses `threading.RLock` for atomic stock checkout operations
  - Evaluate adopting this for concurrent task status updates (prevent race conditions when multiple users mark the same task)

- 🔲 **32. In-memory TTL cache**
  - UFM has a thread-safe TTL cache for performance on read-heavy routes
  - Apply to SpaceMind OS for `/locations` and `/analytics` endpoints (rarely changing data)

- 🔲 **33. Validation-first pattern**
  - UFM calls `utils/validators.py` on every write endpoint before touching the data layer
  - Centralise SpaceMind OS input validation into a dedicated `src/spacemind/utils/validators.py` (currently scattered in Pydantic models + routes)

- 🔲 **34. Excel import/export pipeline**
  - UFM uses `pandas` + `openpyxl` for Excel I/O (facilities teams live in Excel)
  - Add Excel export of execution plans to SpaceMind OS — facilities managers can send plans directly as `.xlsx` workbooks

- 🔲 **35. Blueprint-based route organisation**
  - UFM organises 8 route blueprints by feature domain (auth, inventory, signout, medical, insights, admin, providers, achievements)
  - SpaceMind OS currently has one `routes.py` — split into domain-specific routers as the surface grows: `router_decompose`, `router_locations`, `router_auth`, `router_analytics`, `router_export`

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
