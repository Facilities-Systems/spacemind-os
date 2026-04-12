# SpaceMind OS — World-Class Facilities Intelligence System
## Master Implementation Plan (Updated: 2026-04-12)

**Project:** `C:\Users\sifis\Next-Level-Projects\spacemind-os`
**Git remote:** `https://github.com/Facilities-Systems/spacemind-os.git` (moved from SifisoScS)
**Deployment:** Railway — single container (FastAPI + React SPA), port 8080, SQLite (dev)
**Test count:** 30 unit + 27 integration = **57 tests passing**
**TypeScript:** 0 errors · ESLint: 0 errors

---

## Completed Work

### Infrastructure
- [x] Railway deployment — single-container Dockerfile (Node builds React → Python serves both)
- [x] `start.sh` startup script — fixes Railway `$PORT` binding (root cause of all healthcheck failures)
- [x] `.gitattributes` — LF enforcement for `.sh`, `.py`, `Dockerfile`
- [x] GitHub Actions — tests-only CI (Railway deploys natively via GitHub integration)

### Phase 1 — Fix Current Issues ✅
- [x] 1.1 `datetime.utcnow()` — fixed in `models.py` and `auth.py`
- [x] 1.2 Database file cleanup — `sqlite:///./data/spacemind.db`, gitignored
- [x] 1.3 Global `<ErrorBoundary>` wrapping `App.tsx`
- [x] 1.4 Integration tests — 27 tests across auth, inventory, medical, decompose
- [x] 1.5 User management endpoints — `GET/PATCH /auth/users`, deactivate, role guard
- [x] 1.6 CORS tightening — `cors_dev_origins` field, production uses `CORS_ORIGINS` env var
- [x] 1.7 SmartInsights wired to `/api/v1/insights/summary` — KPIs are live data

### Phase 2 — Adopt from Legacy ✅ (complete except 2.7)
- [x] 2.1 QR Code generation — `GET /inventory/items/{id}/qr`, `qrcode[pil]`
- [x] 2.2 Sign-out compliance analytics — `get_compliance_analytics()`, `/inventory/compliance`
- [x] 2.3 Low-stock prediction & reorder alerts — analytics returns `low_stock_items`, `critical_items`, `reorder_recommendations`
- [x] 2.4 Supplier management — `Supplier` ORM model, `/suppliers` CRUD, migration
- [x] 2.5 Floor plan backend API — `FloorPlan` ORM model, `/floor-plans` CRUD, migration with seeded data, `FloorPlansPage.tsx` wired
- [x] 2.6 Administration portal — `router_admin.py` (`/admin/dashboard`, `/admin/audit-log`), `AdminPage.tsx` (overview/users/audit tabs)
- [ ] **2.7 Medical expiry alerts** — NOT DONE

---

## Next Session — Start Here

### Priority 0 (5 min): Fix remaining `utcnow()` deprecation warnings
3 files still use deprecated `datetime.utcnow()` (Python 3.12 warnings visible in production logs):
- `backend/src/spacemind/domain/schemas.py:96` — `Field(default_factory=datetime.utcnow)`
- `backend/src/spacemind/services/export_service.py:95,223,302` — formatting strings
- `backend/src/spacemind/utils/helpers.py:6` — `now_utc()` helper

**Fix:** Replace with `datetime.now(UTC)` — no migration needed, these are not ORM defaults.

---

### Phase 2.7 — Medical: Expiry Alerts & Equipment Tracking

1. **`backend/src/spacemind/domain/models.py`** — add to `MedicalItem`:
   ```python
   equipment_serial_number = Column(String(100), nullable=True)
   last_service_date       = Column(DateTime,    nullable=True)
   ```
   Verify `MedicalItemCategory` enum includes `'Equipment'` and `'AED'` (TypeScript already has them).

2. **`backend/src/spacemind/storage/repository.py`** — add to `MedicalRepository`:
   - `get_expiring_items(days_ahead=30)` — `expiry_date` between today and today+30
   - `get_expired_items()` — `expiry_date < today`

3. **`backend/src/spacemind/api/router_medical.py`** — add:
   ```
   GET /api/v1/medical/alerts → { expired: [...], expiring_soon: [...], low_stock: [...] }
   ```

4. **New Alembic migration** — `add_medical_equipment_fields`
   - `ALTER TABLE medical_items ADD COLUMN equipment_serial_number VARCHAR(100)`
   - `ALTER TABLE medical_items ADD COLUMN last_service_date DATETIME`

5. **`frontend/src/types/index.ts`** — add `equipment_serial_number` and `last_service_date` to `MedicalItem`

6. **`frontend/src/api/client.ts`** — add `getMedicalAlerts()` method

7. **`frontend/src/pages/MedicalPage.tsx`** — add amber/red alert banner:
   - Red if `expired.length > 0`
   - Amber if `expiring_soon.length > 0`

---

### Phase 3.1 — Asset Lifecycle Management
**Philosophy:** IBM TRIRIGA does this with dashboards. SpaceMind answers "repair vs. replace?" in plain English from real data using Claude.

**New ORM models** (`domain/models.py`):
```python
class Asset(Base):
    __tablename__ = "assets"
    id                   = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name                 = Column(String(200), nullable=False)
    asset_code           = Column(String(50),  unique=True, index=True)
    category             = Column(String(50),  nullable=False)
    location_id          = Column(String(50),  nullable=True)
    floor_plan_id        = Column(String(36),  ForeignKey("floor_plans.id"), nullable=True)
    status               = Column(String(30),  default="active")  # active/under_maintenance/decommissioned
    purchase_date        = Column(DateTime,    nullable=True)
    purchase_cost        = Column(Float,       nullable=True)
    current_value        = Column(Float,       nullable=True)
    depreciation_method  = Column(String(30),  default="straight_line")
    useful_life_years    = Column(Integer,     nullable=True)
    condition_score      = Column(Float,       default=10.0)  # 0.0–10.0
    last_maintained_at   = Column(DateTime,    nullable=True)
    next_maintenance_due = Column(DateTime,    nullable=True)
    supplier_id          = Column(String(36),  ForeignKey("suppliers.id"), nullable=True)
    notes                = Column(Text,        nullable=True)
    created_at           = Column(DateTime,    default=lambda: datetime.now(UTC))
    updated_at           = Column(DateTime,    default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

class AssetMaintenanceLog(Base):
    __tablename__ = "asset_maintenance_logs"
    id               = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    asset_id         = Column(String(36), ForeignKey("assets.id"), nullable=False)
    maintenance_type = Column(String(50))   # preventive / corrective / inspection
    description      = Column(Text)
    cost             = Column(Float,    nullable=True)
    performed_by     = Column(String(100))
    performed_at     = Column(DateTime)
    condition_before = Column(Float,    nullable=True)
    condition_after  = Column(Float,    nullable=True)
    notes            = Column(Text,     nullable=True)
```

**New files:**
- `backend/src/spacemind/api/router_assets.py`
  - `GET /api/v1/assets` (filter by category, status, location)
  - `POST /api/v1/assets`
  - `PATCH /api/v1/assets/{id}`
  - `DELETE /api/v1/assets/{id}` (soft-delete: `status = "decommissioned"`)
  - `GET /api/v1/assets/{id}/history` — maintenance log list
  - `POST /api/v1/assets/{id}/maintenance` — log a maintenance event, update `condition_score`
  - `GET /api/v1/assets/analytics` — avg condition, overdue count, total portfolio value
  - `POST /api/v1/assets/{id}/analyse` — Claude Sonnet: repair vs. replace recommendation
- `backend/src/spacemind/services/asset_service.py`
  - `calculate_current_value(asset)` — straight-line depreciation
  - `calculate_condition_trend(asset_id, db)` — score delta over last N logs
  - `analyse_with_ai(asset_id, db)` — maintenance history → Claude Sonnet → narrative string
- `backend/alembic/versions/xxx_add_assets_tables.py`
- `frontend/src/pages/AssetsPage.tsx` — asset grid + per-asset detail drawer + maintenance log + "AI Analysis" button
- `frontend/src/hooks/useAssets.ts`
- Add `<Route path="/assets" element={<AssetsPage />} />` to `App.tsx`
- Add Assets link to sidebar in `Layout.tsx`

**AI pattern:** Reuse `AIClient._call()` from `ai/client.py`. Reuse decomposition service prompt structure from `services/decomposition_service.py`.

---

### Phase 3.2 — Predictive Maintenance with Condition Scoring
**Builds on 3.1 (Asset model must exist first)**

- `backend/src/spacemind/services/asset_service.py` — add:
  - `predict_maintenance_need(asset_id, db)` → risk score 0–100 from: days since last maintenance, condition trend, maintenance frequency in 12 months
  - `get_maintenance_schedule(db)` — all assets sorted by `next_maintenance_due`, due in 30 days
  - `generate_maintenance_recommendations(assets)` — Claude Haiku fast: bulleted priority list
- `backend/src/spacemind/api/router_assets.py` — add:
  - `GET /api/v1/assets/maintenance-schedule`
  - `GET /api/v1/assets/risk-report`
- `frontend/src/pages/SmartInsightsPage.tsx` — replace hardcoded `PREDICTIONS` with `useQuery(['asset-risk-report'], api.getAssetRiskReport)`

---

### Phase 3.3 — IoT Sensor Data Ingestion
**Philosophy:** IBM/Archibus require Niagara Framework middleware (weeks, expensive). SpaceMind accepts webhook pushes from ANY device.

**New ORM models:**
```python
class SensorDevice(Base):
    id, api_key_hash, name, location_id, sensor_type, is_active, created_at

class SensorReading(Base):
    id, sensor_id (FK → SensorDevice.id), sensor_type, location_id, zone_name,
    value (Float), unit, recorded_at, is_anomaly (bool, default=False)
```

**New files:**
- `backend/src/spacemind/api/router_sensors.py`
  - `POST /api/v1/sensors/ingest` — **API-key auth** (no JWT — device-friendly), registers reading + runs anomaly check
  - `GET /api/v1/sensors/latest` — most recent reading per sensor (live dashboard)
  - `GET /api/v1/sensors/history` — time-series with `?sensor_id=&from=&to=` filter
  - `GET /api/v1/sensors/anomalies` — flagged readings in last 24 hours
  - `POST /api/v1/sensors/analyse` — Claude reads building snapshot → narrative card
- `backend/src/spacemind/services/sensor_service.py`
  - `detect_anomaly(sensor_id, new_value, db)` — deviation > 2 std devs from rolling 20-reading average
- `backend/alembic/versions/xxx_add_sensor_tables.py`
- `frontend/src/pages/SmartInsightsPage.tsx` — IoT tab: replace `SENSOR_OVERVIEW`/`ZONES` with live data; graceful empty state when no sensors registered; "Analyse Building" button → Claude narrative card

---

### Phase 3.4 — AI Concierge (Conversational FM Assistant)
**Philosophy:** ServiceNow Virtual Agent uses decision trees. Claude understands natural language from day 1.

**New files:**
- `backend/src/spacemind/api/router_chat.py`
  - `POST /api/v1/chat` — `{messages: [{role, content}], context?: {location_id, user_role}}`
  - Returns `{reply: string, suggested_action?: {type: string, payload: object}}`
  - Rate limit: 5 req/min per user
- `backend/src/spacemind/services/chat_service.py`
  - `respond(messages, context, db)` — assembles live FM context (low stock count, open incidents, overdue items) into system prompt, calls Claude Haiku
  - `extract_action(reply)` — parses Claude's response for structured action (e.g. `{type: "create_decomposition", payload: {...}}`)
- `backend/src/spacemind/ai/prompts.py` — add `CONCIERGE_SYSTEM_PROMPT`
- `frontend/src/hooks/useChat.ts` — manages message history, sends to `/api/v1/chat`
- `frontend/src/pages/ConciergePage.tsx` — transform from static catalogue to live chat interface: chat history panel + input box + suggested action buttons; keep service catalogue as secondary quick-access

---

### Phase 3.5 — Executive Narrative Reporting
**Philosophy:** IBM/ServiceNow generate tables of numbers. SpaceMind generates a written intelligence briefing with causal reasoning, top concerns, specific actions.

**New files:**
- `backend/src/spacemind/services/report_service.py`
  - `generate_executive_brief(location_id, period_days=7, db)` — assembles: decomposition count/types, inventory health, open incidents, overdue transactions, assets due → Claude Sonnet → `{narrative, key_concerns, recommendations, generated_at}`
- `backend/src/spacemind/api/router_reports.py`
  - `GET /api/v1/reports/executive-brief` — cached 10 min per location (TTLCache from `utils/cache.py`)
  - `GET /api/v1/reports/kpi-summary` — structured KPI data (no AI)
  - `POST /api/v1/reports/generate?type=compliance|inventory|maintenance` — PDF via existing `ExportService`
- `frontend/src/pages/SmartInsightsPage.tsx` — Reports tab: connect each "Generate" button to real endpoints; show Claude narrative for Executive Summary

---

## Phase 4 — Production Ready

### 4.1 PostgreSQL on Railway (do any time — just a config change)
- Add Railway PostgreSQL plugin → Railway auto-injects `DATABASE_URL`
- `psycopg2-binary` already in `requirements.txt` — zero code change
- Verify `alembic upgrade head` runs cleanly on PostgreSQL from fresh DB (all 7+ migrations)
- Current SQLite is ephemeral on Railway (data resets on redeploy)

### 4.2 Energy Management (builds on 3.3)
- `power_kwh` sensor type + `get_energy_summary(location_id, period_days=30)`
- `POST /api/v1/sensors/energy/optimise` — Claude Sonnet: 30-day energy analysis → cost-reduction recommendations
- SmartInsightsPage Sustainability tab: replace `ENV_METRICS` hardcoded data with real sensor data

### 4.3 Employee Self-Service: Room Booking & Concierge Requests (builds on 3.4, 2.5)
- New ORM models: `ConciergeRequest`, `RoomBooking` (with double-booking conflict detection)
- New routers: `router_concierge.py`, `router_bookings.py`; new migration
- `FloorPlansPage.tsx` — "Book a Meeting Room" button → real `POST /api/v1/bookings`; rooms highlighted amber/red based on real booking data

### 4.4 Portfolio Intelligence (builds on 3.5)
- `GET /api/v1/portfolio/summary` — per-location: decomposition count, asset condition avg, inventory health, incident count
- `POST /api/v1/portfolio/analyse` — Claude Sonnet: strategic cross-location analysis → portfolio narrative + per-location ranking
- New `frontend/src/pages/PortfolioPage.tsx`

### 4.5 Production Hardening
- Rate limits enforced: `/chat` (5/min), `/assets/analyse` (2/min), `/portfolio/analyse` (1/min)
- Startup guard already in `main.py` — `SECRET_KEY == default → crash with clear error`
- All Alembic migrations chained; `alembic upgrade head` tested from fresh DB (SQLite + PostgreSQL)
- `backend/.env.prod.example` with PostgreSQL `DATABASE_URL` template
- Expand integration tests to 65+ (add coverage for assets, sensors, chat, reports)

---

## Sequencing Rules
1. **Priority 0** (utcnow fix) — 5 min, do first thing
2. **2.7** (medical alerts) — easy win before moving to Phase 3
3. **3.1** (Assets) must complete before **3.2** (Predictive) — asset model is the foundation
4. **3.3** (Sensors) must complete before **4.2** (Energy) — sensor readings are the data source
5. **3.4** (Chat) must complete before **4.3** (Self-Service) — chat engine powers the portal
6. **4.1** (PostgreSQL) — can be done any time; just add Railway plugin + set `DATABASE_URL`

---

## Key Files Reference

| File | Role |
|---|---|
| `backend/src/spacemind/domain/models.py` | All ORM models — add every new model here |
| `backend/src/spacemind/storage/repository.py` | All DB access — extend existing repos, add new ones |
| `backend/src/spacemind/main.py` | Router registration — `include_router()` every new router |
| `backend/src/spacemind/ai/client.py` | Claude API calls — reuse `_call()` for all AI features |
| `backend/src/spacemind/ai/prompts.py` | All Claude prompts — add new prompts here |
| `backend/src/spacemind/core/validators.py` | Validation-first — add validators before every new write endpoint |
| `backend/src/spacemind/utils/cache.py` | TTLCache — use for expensive repeated queries |
| `backend/src/spacemind/services/audit_service.py` | Audit logging — call `AuditService.log()` on every write |
| `frontend/src/api/client.ts` | All API calls — add new methods here, not inline |
| `frontend/src/App.tsx` | Route registration — add every new page here |
| `start.sh` | Railway startup — handles `$PORT` binding |
| `railway.toml` | Railway config — `startCommand = "/app/start.sh"` |

---

## Deployment Notes
- **Railway:** `startCommand = "/app/start.sh"` — handles `$PORT` (currently 8080)
- **Database:** Currently SQLite (`/app/data/spacemind.db`) — ephemeral on Railway. Add PostgreSQL plugin for persistence.
- **Required Railway env vars:** `ANTHROPIC_API_KEY`, `SECRET_KEY`, `APP_ENV=production`, `CORS_ORIGINS=https://<your-service>.railway.app`
- **Optional:** `DATABASE_URL` (Railway PostgreSQL plugin injects this automatically)

---

## Verification Checklist (End State)
- [ ] `pytest backend/tests/ -v` — 65+ tests passing
- [ ] `cd frontend && tsc --noEmit` — 0 TypeScript errors
- [ ] Submit "Move 40 staff from FP1 to FP2" → 6-phase plan returned
- [ ] Add inventory item with `min_level=10`, set qty to 3 → amber banner appears
- [ ] Medical item with `expiry_date` in 15 days → amber alert banner on MedicalPage
- [ ] Register a sensor device → push reading via `POST /sensors/ingest` → appears in SmartInsights IoT tab
- [ ] Open Concierge page → chat with Claude → "report a broken AC" → suggested action pre-fills decompose form
- [ ] `GET /reports/executive-brief` → Claude-generated narrative in plain English
- [ ] `GET /portfolio/summary` → all locations aggregated
- [ ] `alembic upgrade head` from fresh DB — all migrations apply cleanly
- [ ] Railway deploy → green, `start.sh` logs show correct PORT, app responds at Railway URL
