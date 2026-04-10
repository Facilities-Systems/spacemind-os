# SpaceMind OS

> **The AI that thinks like a 30-year veteran Facilities Manager.**
>
> Turn any natural language facilities request into a fully structured, sequenced, responsibility-aware execution plan — across owned and rented multi-country offices.

---

## System Architecture

```mermaid
flowchart TD
    A([User Request\nNatural Language]) --> B[React Frontend]
    B --> C[FastAPI Layer\n/api/v1/decompose]

    C --> D[Request Classifier]
    D -->|keyword match| E{Type Known?}
    E -->|yes| F[Template Loader]
    E -->|no| G[Claude Haiku\nAI Classifier]
    G --> F

    F --> H[YAML Knowledge Templates\noffice_move · full_fitout\nrenovation · canteen · maintenance]
    H --> I[Location Context Engine\nowned vs rented · country rules]

    I --> J[Claude Sonnet\nDecomposition Engine]

    J --> K[Business Rules Engine]
    K --> L{Fit-Out or\nRenovation?}
    L -->|yes| M[Enforce\nCeiling → Walls → Floor]
    L -->|no| N[Apply Landlord\nApproval Flags]
    M --> N

    N --> O[Result Validator]
    O --> P[(PostgreSQL\nHistory Store)]
    O --> Q([Structured\nExecution Plan])

    Q --> R[React UI\nPhases · Tasks · Risks · Recommendations]
```

---

## Request Flow — Detailed

```mermaid
sequenceDiagram
    actor FM as Facilities Manager
    participant UI as React Frontend
    participant API as FastAPI
    participant CLS as Classifier
    participant TPL as Template Engine
    participant AI as Claude Sonnet
    participant DB as Database

    FM->>UI: Submit request in plain language
    UI->>API: POST /api/v1/decompose
    API->>CLS: classify(request_text)
    CLS-->>API: RequestType (e.g. full_fitout)
    API->>TPL: load_template(full_fitout)
    TPL-->>API: YAML knowledge template
    API->>AI: decompose(request + template + location_context)
    AI-->>API: Structured JSON plan
    API->>API: Apply business rules\n(sequencing + landlord flags)
    API->>DB: Persist result
    API-->>UI: DecompositionResult
    UI-->>FM: Phases, Tasks, Risks, Recommendations
```

---

## Knowledge Engine — Fit-Out Sequencing Rule

```mermaid
flowchart LR
    subgraph WRONG["❌ Wrong Sequence"]
        direction TB
        W1[Floor Works] --> W2[Wall Works] --> W3[Ceiling Works]
    end

    subgraph RIGHT["✅ Correct Sequence — Always"]
        direction TB
        R1[Ceiling Works\nHVAC · Sprinklers · Data cabling\nElectrical · Lighting grid] -->
        R2[Wall & Partition Works\nPartitions · Doors · Plastering\nPaint · Wall outlets] -->
        R3[Floor Works\nSub-floor prep · Carpet tiles\nLVT · Skirting boards]
    end

    style WRONG fill:#3d0000,stroke:#7f1d1d,color:#fca5a5
    style RIGHT fill:#052e16,stroke:#14532d,color:#86efac
```

---

## Location & Tenure Logic

```mermaid
flowchart TD
    REQ[Facilities Request] --> LOC{Building Tenure}

    LOC -->|OWNED| OWN[Full Internal Authority\nNo landlord constraints\nFP1 HQ South Africa]
    LOC -->|RENTED| RNT[Landlord Rules Apply]

    RNT --> CHECKS{Scope of Work}
    CHECKS -->|Structural changes| LA1[Landlord Written Approval\n⚠ Allow 4+ weeks]
    CHECKS -->|M&E penetrations| LA2[Building Authority Sign-off]
    CHECKS -->|Ceiling · Walls · Floor| LA3[Lease Dilapidations Review]
    CHECKS -->|Minor maintenance| LA4[Notify Only]

    OWN --> PLAN[Generate Execution Plan]
    LA1 --> PLAN
    LA2 --> PLAN
    LA3 --> PLAN
    LA4 --> PLAN
```

---

## Phase 1 — Current MVP

```mermaid
graph LR
    subgraph Backend["Backend — FastAPI + Python"]
        B1[Classifier]
        B2[Template Engine\n5 YAML templates]
        B3[Claude Sonnet AI]
        B4[Rules Engine]
        B5[PostgreSQL Store]
    end

    subgraph Frontend["Frontend — React + TypeScript"]
        F1[Dashboard]
        F2[New Request]
        F3[History]
        F4[Locations]
    end

    subgraph Templates["Knowledge Templates"]
        T1[Office Move]
        T2[Full Fit-Out]
        T3[Floor Renovation]
        T4[Canteen Setup]
        T5[Maintenance]
    end

    Frontend <-->|REST API| Backend
    B2 --- Templates
```

---

## Phase 2 — Multi-Agent Roadmap

```mermaid
flowchart TD
    REQ([User Request]) --> SUP[Supervisor Agent\nOrchestrator]

    SUP --> OPA[Operations Planner Agent\nSequencing · phases · timelines]
    SUP --> TSA[Technical Specialist Agent\nM&E · IT · structural constraints]
    SUP --> CTX[Context Agent\nLocation · tenure · country regulations]
    SUP --> VCA[Vendor Coordinator Agent\nProcurement · SLAs · quotes]

    OPA --> KRA[Knowledge Retrieval Agent\nVector store · past cases · templates]
    TSA --> KRA
    CTX --> KRA
    VCA --> KRA

    KRA --> SYN[Synthesizer Agent\nMerge · validate · deduplicate]
    SYN --> OUT([Validated Execution Plan])
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/)

### Backend

```bash
# 1. Clone
git clone https://github.com/SifisoScS/spacemind-os.git
cd spacemind-os

# 2. Set up environment
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the API
python run_dev.py
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Docker (full stack)

```bash
docker-compose up --build
# API  → http://localhost:8000
# UI   → http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/decompose` | Submit a facilities request |
| `GET` | `/api/v1/history` | List all past decompositions |
| `GET` | `/api/v1/history/{id}` | Retrieve a specific plan |
| `GET` | `/api/v1/locations` | List all known office locations |
| `GET` | `/api/v1/health` | System health check |

### Example request

```bash
curl -X POST http://localhost:8000/api/v1/decompose \
  -H "Content-Type: application/json" \
  -d '{
    "request_text": "Move 40 staff from FP1 to FP2 within the next 6 weeks",
    "location_id": "FP2_SouthAfrica",
    "priority": "high"
  }'
```

---

## Knowledge Templates

| Template | Operation Type | Key Rule |
|----------|---------------|----------|
| `office_move.yaml` | Staff relocation | IT readiness is always critical path |
| `full_fitout.yaml` | New office build | Ceiling → Walls → Floor, non-negotiable |
| `floor_renovation.yaml` | Occupied floor refresh | Phased approach, nights/weekends |
| `canteen_setup.yaml` | Canteen / kitchen | HACCP compliance, gas certification |
| `maintenance.yaml` | Reactive & planned | P1/P2/P3 triage, SLA enforcement |

---

## Office Locations

| Location ID | Country | Tenure | Landlord Required |
|-------------|---------|--------|------------------|
| `FP1_HQ_SouthAfrica` | South Africa | Owned | No |
| `FP2_SouthAfrica` | South Africa | Rented | Yes |
| `NAIROBI_Kenya` | Kenya | Rented | Yes |
| `LAGOS_Nigeria` | Nigeria | Rented | Yes |
| `LONDON_UK` | United Kingdom | Rented | Yes |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI | Claude Sonnet 4.6 (decomposition) · Claude Haiku (classification) |
| Backend | FastAPI · Python 3.11 · Pydantic v2 |
| Database | PostgreSQL (prod) · SQLite (dev) · SQLAlchemy |
| Templates | PyYAML |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| Data Fetching | TanStack Query |
| Routing | React Router v6 |
| Deployment | Docker · Nginx |

---

## Project Structure

```
spacemind-os/
├── src/spacemind/
│   ├── ai/              # Claude client + all prompts
│   ├── api/             # FastAPI routes
│   ├── core/            # Config, constants, logging
│   ├── domain/          # Pydantic schemas + ORM models
│   ├── engine/          # Classifier, decomposer, validator
│   ├── knowledge/       # YAML templates + business rules
│   ├── services/        # Application-layer orchestration
│   ├── storage/         # DB session + repository
│   └── utils/           # Helpers, location context
├── frontend/
│   └── src/
│       ├── api/         # Axios client
│       ├── components/  # Layout, decompose, history, UI atoms
│       ├── hooks/       # TanStack Query hooks
│       ├── pages/       # Dashboard, Decompose, History, Locations
│       └── types/       # TypeScript types (mirrors backend schemas)
├── tests/unit/          # Classifier + rules unit tests
├── docker-compose.yml
└── requirements.txt
```

---

*Built with Claude Sonnet 4.6 — Anthropic*
