# Climate Risk Intelligence Platform — TODO

> **Workflow Rules (Read Before Starting)**
>
> - `main` is **production-only**. Never commit directly to `main`.
> - `develop` is the **integration branch**. All features merge here first.
> - Every feature or fix gets its own branch, cut from `develop`.
> - Pull Requests (PRs) are required to merge any branch into `develop`.
> - Only `develop` merges into `main` at version release checkpoints.
> - Every version release on `main` must be **tagged** (e.g., `git tag -a v1.0.0`).
> - Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
> `type(scope): description`
> Types: `feat`, `fix`, `chore`, `ci`, `test`, `docs`, `refactor`

---



## v0.1-alpha — Project Foundation & Infrastructure

> **Scope Lock:** This version contains ONLY project scaffolding, environment
> configuration, and repository setup. No business logic. No API calls. No UI
> components beyond boilerplate. If a task involves actual features, it belongs
> in a later version.

---



### Step 1 — Initialize the GitHub Repository

- [x] Go to GitHub and create a new repository named `climate-risk-platform`
- [x] Add description: "Address-level climate risk intelligence for property
  ```
  investors, developers, and lenders."
  ```
- [x] Do **not** initialize with a README (you will create it manually)
- [x] Clone the empty repository locally:
  ```bash
  git clone https://github.com/YOUR_USERNAME/climate-risk-platform.git
  cd climate-risk-platform
  ```



### Step 2 — Configure the Persistent Branch Structure

- [x] Create and push the `develop` integration branch:
  ```bash
  git checkout -b develop
  git push -u origin develop
  ```
- [x] In GitHub → Settings → Branches → set `develop` as the **default branch**
- [x] Add branch protection rules to `main`:
  - Require at least one PR review before merging
  - Disallow direct pushes to `main`
  - Require status checks (CI) to pass before merging



### Step 3 — Cut the First Feature Branch

- [x] Create a branch for all v0.1-alpha scaffolding work:
  ```bash
  git checkout -b setup/project-foundation
  ```



### Step 4 — Define the Monorepo Folder Structure

- [x] Create the following directory tree manually:
  ```
  climate-risk-platform/
  ├── frontend/           # Next.js application
  ├── backend/            # FastAPI application
  ├── docs/               # Architecture docs, data source notes
  ├── scripts/            # Utility and deployment scripts
  ├── .github/
  │   └── workflows/      # GitHub Actions CI/CD pipelines
  ├── .gitignore
  ├── README.md
  ├── CHANGELOG.md
  └── TODO.md
  ```
- [x] Add a `.gitkeep` placeholder file inside every empty directory so Git
  ```
  tracks the structure
  ```



### Step 5 — Create the Global `.gitignore`

- [x] Create `.gitignore` in the project root:
  ```
  # Environment files
  .env
  .env.local
  .env.*.local

  # Python
  __pycache__/
  *.py[cod]
  *.pyo
  .venv/
  venv/
  *.egg-info/
  dist/
  build/
  .pytest_cache/
  .coverage
  htmlcov/

  # Node.js
  node_modules/
  .next/
  out/
  .cache/

  # OS
  .DS_Store
  Thumbs.db

  # IDE
  .vscode/
  .idea/
  *.swp

  # Database
  *.db
  *.sqlite

  # Logs
  *.log
  logs/
  ```



### Step 6 — Create Placeholder Documentation Files

- [x] Create a minimal `README.md` in the project root (a single-line
  ```
  placeholder — it will be finalized at v1.0)
  ```
- [x] Create `CHANGELOG.md` with an `[Unreleased]` section only
- [x] Create `TODO.md` (this file) in the project root



### Step 7 — First Commit: Repository Skeleton

```bash
git add .
git commit -m "chore: initialize monorepo structure with .gitignore and placeholder docs"
git push -u origin setup/project-foundation
```

---



### Step 8 — Scaffold the Frontend (Next.js)

- [x] Navigate to `frontend/` and initialize the Next.js project:
  ```bash
  cd frontend
  npx create-next-app@latest . \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --src-dir \
    --import-alias "@/*"
  ```
- [x] Verify it runs: `npm run dev` → open `http://localhost:3000` and confirm
  ```
  the default Next.js page renders
  ```



### Step 9 — Configure the Frontend Folder Structure

- [x] Inside `frontend/src/`, create the following subdirectories:
  ```
  src/
  ├── app/                # Next.js App Router pages
  ├── components/
  │   ├── ui/             # Generic, reusable UI primitives
  │   ├── layout/         # Header, Footer, page shells
  │   └── dashboard/      # Risk dashboard-specific components
  ├── lib/                # Utility functions and API client
  ├── hooks/              # Custom React hooks
  ├── types/              # TypeScript type definitions
  └── styles/             # Global styles beyond Tailwind defaults
  ```
- [x] Add `.gitkeep` to each empty directory



### Step 10 — Configure Frontend Environment Variables

- [x] Create `frontend/.env.local` (gitignored — never commit this):
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
  ```
- [x] Create `frontend/.env.example` (committed — safe template for teammates):
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
  ```



### Step 11 — Commit: Frontend Scaffold

```bash
git add .
git commit -m "chore(frontend): scaffold Next.js app with TypeScript, Tailwind CSS, and folder structure"
```

---



### Step 12 — Scaffold the Backend (FastAPI)

- [x] Navigate to `backend/` and create a Python virtual environment:
  ```bash
  cd backend
  python -m venv .venv
  source .venv/bin/activate     # macOS/Linux
  # .venv\Scripts\activate      # Windows
  ```
- [x] Create `backend/requirements.txt`:
  ```
  fastapi==0.111.0
  uvicorn[standard]==0.29.0
  sqlalchemy==2.0.30
  alembic==1.13.1
  asyncpg==0.29.0
  pydantic==2.7.1
  pydantic-settings==2.2.1
  python-dotenv==1.0.1
  httpx==0.27.0
  openai>=1.30.0
  pytest==8.2.0
  pytest-asyncio==0.23.6
  ```
- [x] Install: `pip install -r requirements.txt`



### Step 13 — Define the Backend Folder Structure

- [x] Inside `backend/`, create the following layout:
  ```
  backend/
  ├── app/
  │   ├── api/
  │   │   └── v1/
  │   │       └── endpoints/    # One file per route domain
  │   ├── core/
  │   │   ├── config.py         # App settings via pydantic-settings
  │   │   └── database.py       # SQLAlchemy async session setup
  │   ├── models/               # SQLAlchemy ORM models
  │   ├── schemas/              # Pydantic request/response schemas
  │   └── services/
  │       ├── ai/               # AI summary generation
  │       ├── climate/          # External data source integrations
  │       └── scoring/          # Risk scoring algorithms
  ├── app/main.py               # FastAPI app entrypoint
  ├── alembic/                  # Alembic migration environment
  ├── tests/                    # Pytest test files
  ├── .env
  ├── .env.example
  └── requirements.txt
  ```



### Step 14 — Create the FastAPI Application Entrypoint

- [x] Create `backend/app/main.py`:
  ```python
  from fastapi import FastAPI
  from fastapi.middleware.cors import CORSMiddleware

  app = FastAPI(
      title="Climate Risk Intelligence Platform API",
      version="0.1.0",
      description="API for address-level climate risk analysis."
  )

  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:3000"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )

  @app.get("/health")
  async def health_check():
      return {"status": "ok", "version": "0.1.0"}
  ```
- [x] Start the server and verify: `uvicorn app.main:app --reload` →
  ```
  `GET http://localhost:8000/health` returns `{"status": "ok"}`
  ```



### Step 15 — Configure Backend Settings Module

- [x] Create `backend/app/core/config.py`:
  ```python
  from pydantic_settings import BaseSettings

  class Settings(BaseSettings):
      DATABASE_URL: str
      GOOGLE_MAPS_API_KEY: str
      OPENAI_API_KEY: str
      NOAA_API_KEY: str = ""
      NASA_API_KEY: str = ""
      FEMA_API_KEY: str = ""

      class Config:
          env_file = ".env"

  settings = Settings()
  ```
- [x] Create `backend/.env` (gitignored):
  ```
  DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/climate_risk
  GOOGLE_MAPS_API_KEY=your_key_here
  OPENAI_API_KEY=your_key_here
  ```
- [x] Create `backend/.env.example` (committed — safe template):
  ```
  DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:PORT/climate_risk
  GOOGLE_MAPS_API_KEY=
  OPENAI_API_KEY=
  NOAA_API_KEY=
  NASA_API_KEY=
  FEMA_API_KEY=
  ```



### Step 16 — Commit: Backend Scaffold

```bash
git add .
git commit -m "chore(backend): scaffold FastAPI app with folder structure, settings, and health endpoint"
```

---



### Step 17 — Set Up PostgreSQL and Docker

- [x] Create `docker-compose.yml` in the project root:
  ```yaml
  version: '3.9'

  services:
    db:
      image: postgres:16
      container_name: climate_risk_db
      environment:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: password
        POSTGRES_DB: climate_risk
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data

    backend:
      build: ./backend
      container_name: climate_risk_backend
      command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
      volumes:
        - ./backend:/app
      ports:
        - "8000:8000"
      depends_on:
        - db
      env_file:
        - ./backend/.env

    frontend:
      build: ./frontend
      container_name: climate_risk_frontend
      command: npm run dev
      volumes:
        - ./frontend:/app
        - /app/node_modules
      ports:
        - "3000:3000"
      env_file:
        - ./frontend/.env.local

  volumes:
    postgres_data:
  ```
- [x] Create `backend/Dockerfile`:
  ```dockerfile
  FROM python:3.12-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY . .
  ```
- [x] Create `frontend/Dockerfile`:
  ```dockerfile
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm install
  COPY . .
  ```
- [x] Test the full stack: `docker-compose up --build`
- [x] Verify all three containers start without errors



### Step 18 — Initialize Alembic for Database Migrations

- [x] Inside `backend/`, run:
  ```bash
  alembic init alembic
  ```
- [x] Edit `backend/alembic/env.py` to connect to your settings:
  ```python
  from app.core.config import settings
  config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
  ```



### Step 19 — Commit: Docker and Database Configuration

```bash
git add .
git commit -m "chore: add Docker Compose, PostgreSQL setup, and Alembic migration scaffold"
```

---



### Step 20 — Set Up GitHub Actions CI Pipeline

- [x] Create `.github/workflows/ci.yml`:
  ```yaml
  name: CI

  on:
    push:
      branches: [develop, main]
    pull_request:
      branches: [develop, main]

  jobs:
    backend-tests:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with:
            python-version: '3.12'
        - run: pip install -r backend/requirements.txt
        - run: cd backend && pytest tests/ -v

    frontend-lint:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
        - run: cd frontend && npm ci
        - run: cd frontend && npm run lint
  ```



### Step 21 — Commit: CI Pipeline

```bash
git add .
git commit -m "ci: add GitHub Actions workflow for backend tests and frontend linting"
```

---



### Step 22 — Merge v0.1-alpha into `develop` and Tag

- [x] Push the feature branch:
  ```bash
  git push origin setup/project-foundation
  ```
- [x] Open a Pull Request on GitHub: `setup/project-foundation` → `develop`
- [x] Review the PR diff — confirm all scaffolding files are present and correct
- [x] Merge the PR using **"Squash and Merge"** for a clean history
- [x] Pull the updated `develop` locally:
  ```bash
  git checkout develop
  git pull origin develop
  ```
- [x] Tag v0.1-alpha:
  ```bash
  git tag -a v0.1-alpha -m "v0.1-alpha: project foundation and infrastructure scaffolding"
  git push origin v0.1-alpha
  ```

> ✅ **v0.1-alpha Complete.** You now have a working monorepo with a Next.js
> frontend, FastAPI backend, PostgreSQL database, Docker local dev environment,
> and a GitHub Actions CI pipeline. Zero features — only infrastructure.

---

---



## v0.2-alpha — Geocoding & Climate Risk Data Services

> **Scope Lock:** This version builds the backend data pipeline only: address
> geocoding, climate data source integrations, and the four-hazard risk scoring
> engine. No frontend work. No AI summaries.

---



### Step 23 — Create the Geocoding Service Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/geocoding-service
```



### Step 24 — Define the Address Pydantic Schemas

- [x] Create `backend/app/schemas/address.py`:
  ```python
  from pydantic import BaseModel

  class AddressRequest(BaseModel):
      address: str

  class Coordinates(BaseModel):
      latitude: float
      longitude: float
      formatted_address: str
      place_id: str
  ```



### Step 25 — Build the Geocoding Service

- [x] Create `backend/app/services/geocoding.py`:
  ```python
  import httpx
  from app.core.config import settings
  from app.schemas.address import Coordinates

  GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

  async def geocode_address(address: str) -> Coordinates:
      async with httpx.AsyncClient() as client:
          response = await client.get(
              GEOCODE_URL,
              params={"address": address, "key": settings.GOOGLE_MAPS_API_KEY}
          )
          data = response.json()

      if data["status"] != "OK":
          raise ValueError(f"Geocoding failed: {data['status']}")

      result = data["results"][0]
      location = result["geometry"]["location"]

      return Coordinates(
          latitude=location["lat"],
          longitude=location["lng"],
          formatted_address=result["formatted_address"],
          place_id=result["place_id"]
      )
  ```



### Step 26 — Create the Geocoding API Endpoint

- [x] Create `backend/app/api/v1/endpoints/geocoding.py`:
  ```python
  from fastapi import APIRouter, HTTPException
  from app.schemas.address import AddressRequest, Coordinates
  from app.services.geocoding import geocode_address

  router = APIRouter()

  @router.post("/geocode", response_model=Coordinates)
  async def geocode(request: AddressRequest):
      try:
          return await geocode_address(request.address)
      except ValueError as e:
          raise HTTPException(status_code=400, detail=str(e))
  ```
- [x] Register the router in `backend/app/main.py` under the `/api/v1` prefix



### Step 27 — Write Unit Tests for Geocoding

- [x] Create `backend/tests/test_geocoding.py`:
  - Test: a valid US address returns a `Coordinates` object with non-null lat/lng
  - Test: an invalid or garbage address raises `ValueError`
  - Test: an empty string address raises a Pydantic validation error
- [x] Run: `pytest backend/tests/test_geocoding.py -v`



### Step 28 — Commit: Geocoding Service

```bash
git add .
git commit -m "feat(geocoding): implement Google Maps geocoding service and POST /api/v1/geocode endpoint"
```

---



### Step 29 — Create the Climate Data Integration Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/climate-data-integration
```



### Step 30 — Document All Data Sources

- [ ] Create `docs/data-sources.md` and document each of the following:
  - **NOAA Climate Data Online (CDO) API:** base URL, auth method (token header),
  how to query temperature normals and extreme event history by station
  - **NASA EarthData API:** required datasets for temperature projections,
  auth method, coordinate-based query format
  - **FEMA National Flood Hazard Layer (NFHL) API:** ArcGIS REST endpoint,
  how to query flood zone by latitude/longitude bounding box
  - **USGS Wildland Fire Interagency Geospatial Services:** endpoint format,
  how to query fire perimeter history by geographic area
  - For each source: document rate limits, response format, and known edge cases



### Step 31 — Build the FEMA Flood Data Service

- [ ] Create `backend/app/services/climate/flood_data.py`:
  - Query the FEMA NFHL ArcGIS REST API using latitude and longitude
  - Return: flood zone designation (e.g., AE, X, AO), base flood elevation,
  special flood hazard area boolean flag
  - Handle API errors and timeouts gracefully; return a default low-risk object
  on failure rather than crashing



### Step 32 — Build the NOAA Hurricane Data Service

- [ ] Create `backend/app/services/climate/hurricane_data.py`:
  - Query NOAA historical hurricane track data (IBTrACS dataset or CDO) for the
  surrounding region of the given coordinates
  - Return: historical storm count (last 50 years), nearest track distance in km,
  category distribution breakdown (Cat 1–5 counts)
  - Handle API errors gracefully with fallback defaults



### Step 33 — Build the Heatwave Data Service

- [ ] Create `backend/app/services/climate/heat_data.py`:
  - Query NOAA CDO temperature data for the nearest climate station to the
  given coordinates
  - Calculate: average extreme heat days per year (days exceeding 95°F / 35°C),
  trend direction over the last 30 years, projected 2050 delta
  - Return structured heat risk indicators and trend direction



### Step 34 — Build the Wildfire Data Service

- [ ] Create `backend/app/services/climate/wildfire_data.py`:
  - Query USGS wildfire perimeter data for a 50 km radius around the coordinates
  - Return: fire count in the last 20 years, fire weather zone designation,
  dominant vegetation/fuel type (WUI classification)
  - Handle empty results (no fire history) as low risk, not an error



### Step 35 — Commit: Climate Data Services

```bash
git add .
git commit -m "feat(climate-data): integrate FEMA flood, NOAA hurricane/heat, and wildfire data services"
```

---



### Step 36 — Create the Risk Scoring Engine Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/risk-scoring-engine
```



### Step 37 — Define the Risk Report Pydantic Schemas

- [ ] Create `backend/app/schemas/risk.py`:
  ```python
  from pydantic import BaseModel, Field
  from typing import Optional

  class HazardScore(BaseModel):
      score: int = Field(..., ge=0, le=100)
      severity: str     # "Low" | "Moderate" | "High" | "Extreme"
      confidence: str   # "Low" | "Medium" | "High"
      primary_factors: list[str]

  class ClimateRiskReport(BaseModel):
      address: str
      latitude: float
      longitude: float
      flood_risk: HazardScore
      hurricane_risk: HazardScore
      heat_risk: HazardScore
      wildfire_risk: HazardScore
      overall_risk_score: int = Field(..., ge=0, le=100)
      verdict: str      # "Go" | "Caution" | "Avoid"
      ai_summary: Optional[str] = None
      generated_at: str
  ```



### Step 38 — Build the Severity Label Helper

- [ ] Create `backend/app/services/scoring/helpers.py`:
  - Function `score_to_severity(score: int) -> str`:
    - 0–25 → `"Low"`
    - 26–50 → `"Moderate"`
    - 51–75 → `"High"`
    - 76–100 → `"Extreme"`



### Step 39 — Build the Flood Risk Scoring Algorithm

- [ ] Create `backend/app/services/scoring/flood_scorer.py`:
  - Input: FEMA flood zone data for the coordinates
  - Scoring logic:
    - Zone AE or A (1% annual flood chance) → base score 70–90
    - Zone AO (shallow flooding) → base score 50–70
    - Zone X (shaded, 0.2% annual chance) → base score 30–50
    - Zone X (unshaded, minimal risk) → base score 5–20
    - Adjust upward for coastal proximity (within 1 mile of ocean/bay)
    - Adjust upward for low elevation relative to base flood elevation
  - Output: `HazardScore` with score, severity, confidence, and top 3 factors



### Step 40 — Build the Hurricane Risk Scoring Algorithm

- [ ] Create `backend/app/services/scoring/hurricane_scorer.py`:
  - Input: NOAA hurricane data + coordinates
  - Scoring logic:
    - Coastal proximity within 25 miles → apply high multiplier
    - Storm frequency: storms per decade in surrounding region
    - Category distribution: Cat 4/5 presence adds heavy penalty
    - Latitude band: tropical latitudes (15°N–35°N) carry higher base score
  - Output: `HazardScore`



### Step 41 — Build the Heat Risk Scoring Algorithm

- [ ] Create `backend/app/services/scoring/heat_scorer.py`:
  - Input: NOAA temperature data + coordinates
  - Scoring logic:
    - Days per year exceeding 95°F/35°C (scale 0–100 over 0–90 days)
    - Urban heat island adjustment: city center +5–10 points
    - Projected 2050 temperature delta: each degree above 2°C adds points
  - Output: `HazardScore`



### Step 42 — Build the Wildfire Risk Scoring Algorithm

- [ ] Create `backend/app/services/scoring/wildfire_scorer.py`:
  - Input: USGS wildfire data + coordinates
  - Scoring logic:
    - Fire count density per 100 km² over last 20 years (scale to 0–100)
    - WUI (Wildland-Urban Interface) zone designation adds 10–20 points
    - Drought index / vegetation dryness multiplier
    - Distance from last fire perimeter: within 5 km → high adjustment
  - Output: `HazardScore`



### Step 43 — Build the Risk Aggregator

- [ ] Create `backend/app/services/scoring/aggregator.py`:
  - Combine the four hazard scores using weighted averaging:
    - Flood: 30%, Hurricane: 30%, Heat: 20%, Wildfire: 20%
    - (Weights are reasonable defaults — will become configurable in v3.0)
  - Apply the Go / Caution / Avoid verdict thresholds:
    - 0–35 → **"Go"**
    - 36–65 → **"Caution"**
    - 66–100 → **"Avoid"**
  - Return a complete `ClimateRiskReport` object



### Step 44 — Create the Risk Analysis API Endpoint

- [ ] Create `backend/app/api/v1/endpoints/risk.py`:
  ```python
  from fastapi import APIRouter, HTTPException
  from app.schemas.address import AddressRequest
  from app.schemas.risk import ClimateRiskReport
  from app.services.geocoding import geocode_address
  from app.services.scoring.aggregator import build_risk_report

  router = APIRouter()

  @router.post("/analyze", response_model=ClimateRiskReport)
  async def analyze_risk(request: AddressRequest):
      try:
          coordinates = await geocode_address(request.address)
          report = await build_risk_report(coordinates)
          return report
      except ValueError as e:
          raise HTTPException(status_code=400, detail=str(e))
      except Exception as e:
          raise HTTPException(status_code=500, detail="Risk analysis failed.")
  ```
- [ ] Register this router in `backend/app/main.py`



### Step 45 — Write Unit Tests for the Risk Scoring Engine

- [ ] Create `backend/tests/test_risk_scoring.py`:
  - Test: Miami Beach, FL → flood score ≥ 70, hurricane score ≥ 80
  - Test: Denver, CO → flood score ≤ 30, hurricane score ≤ 15
  - Test: Paradise, CA → wildfire score ≥ 75
  - Test: Phoenix, AZ → heat score ≥ 70
  - Test: Iowa City, IA → moderate flood score, low hurricane score
  - Test: All four scores are always in the range [0, 100]
  - Test: Overall score ≤ 35 → verdict is "Go"
  - Test: Overall score 36–65 → verdict is "Caution"
  - Test: Overall score ≥ 66 → verdict is "Avoid"
- [ ] Run: `pytest backend/tests/test_risk_scoring.py -v`
- [ ] Achieve minimum 80% coverage on all scoring modules



### Step 46 — Commit: Risk Scoring Engine

```bash
git add .
git commit -m "feat(scoring): implement flood, hurricane, heat, and wildfire scoring with aggregator and verdict logic"
```

---



### Step 47 — Merge v0.2-alpha Features and Tag

- [ ] Push all feature branches:
  ```bash
  git push origin feature/geocoding-service
  git push origin feature/climate-data-integration
  git push origin feature/risk-scoring-engine
  ```
- [ ] Open PRs in GitHub, merging in this order (each depends on the previous):
  1. `feature/geocoding-service` → `develop`
  2. `feature/climate-data-integration` → `develop`
  3. `feature/risk-scoring-engine` → `develop`
- [ ] After all three PRs are merged, pull and tag:
  ```bash
  git checkout develop
  git pull origin develop
  git tag -a v0.2-alpha -m "v0.2-alpha: geocoding, climate data integration, and risk scoring engine"
  git push origin v0.2-alpha
  ```

> ✅ **v0.2-alpha Complete.** The backend can accept an address, geocode it,
> fetch real climate data from NOAA, NASA, FEMA, and USGS, and return a
> structured `ClimateRiskReport` with four hazard scores and a Go/Caution/Avoid
> verdict.

---

---



## v0.3-alpha — Frontend Dashboard (Full UI, No AI Yet)

> **Scope Lock:** This version builds the complete frontend user interface and
> connects it to the v0.2-alpha backend. No AI summaries. No user accounts.
> No PDF generation. No payment flows.

---



### Step 48 — Create the App Layout Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/app-layout
```



### Step 49 — Build the Global Layout Components

- [ ] Create `frontend/src/components/layout/Header.tsx`:
  - Platform logo (text placeholder: "ClimateRisk")
  - Navigation links: "Home", "About", "Pricing"
  - "Sign In" button (non-functional placeholder — enabled in v2.0)
- [ ] Create `frontend/src/components/layout/Footer.tsx`:
  - Copyright line
  - Links: Privacy Policy, Terms of Service, Contact
- [ ] Update `frontend/src/app/layout.tsx` to wrap all pages in the Header/Footer
  ```
  shell
  ```



### Step 50 — Establish the Design System

- [ ] Update `frontend/tailwind.config.ts` with a custom color palette:
  ```ts
  theme: {
    extend: {
      colors: {
        risk: {
          low:      '#22c55e',  // green-500
          moderate: '#f59e0b',  // amber-500
          high:     '#ef4444',  // red-500
          extreme:  '#7f1d1d',  // red-950
        },
        brand: {
          primary: '#1e3a5f',   // deep navy
          accent:  '#38bdf8',   // sky blue
        }
      }
    }
  }
  ```
- [ ] Document the palette and usage rules in `docs/design-system.md`



### Step 51 — Commit: Layout and Design System

```bash
git add .
git commit -m "feat(frontend): add global Header/Footer layout and configure Tailwind design system"
```

---



### Step 52 — Create the Address Search Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/address-search-ui
```



### Step 53 — Build the Frontend API Client

- [ ] Create `frontend/src/lib/api-client.ts`:
  ```typescript
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  export async function analyzeAddress(address: string) {
    const response = await fetch(`${API_BASE}/api/v1/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `API error: ${response.statusText}`);
    }

    return response.json();
  }
  ```



### Step 54 — Define Frontend TypeScript Types

- [ ] Create `frontend/src/types/risk.ts`:
  ```typescript
  export type Severity = 'Low' | 'Moderate' | 'High' | 'Extreme';
  export type Verdict  = 'Go' | 'Caution' | 'Avoid';

  export interface HazardScore {
    score:           number;
    severity:        Severity;
    confidence:      string;
    primary_factors: string[];
  }

  export interface ClimateRiskReport {
    address:            string;
    latitude:           number;
    longitude:          number;
    flood_risk:         HazardScore;
    hurricane_risk:     HazardScore;
    heat_risk:          HazardScore;
    wildfire_risk:      HazardScore;
    overall_risk_score: number;
    verdict:            Verdict;
    ai_summary?:        string;
    generated_at:       string;
  }
  ```



### Step 55 — Build the Address Search Component

- [ ] Create `frontend/src/components/ui/AddressSearch.tsx`:
  - Text input with placeholder: "Enter a property address (e.g., 123 Main St, Miami, FL)"
  - "Analyze Risk" submit button
  - Loading spinner displayed while the API call is in progress
  - Inline error message on failure (red text below the input)
  - On success: calls a parent `onResult(report)` callback
  - Disable the submit button while loading to prevent duplicate requests



### Step 56 — Build the Landing Page

- [ ] Update `frontend/src/app/page.tsx`:
  - Hero section headline: "Understand Climate Risk Before You Invest"
  - Sub-headline: "Enter any U.S. property address for an instant, data-backed
  climate risk assessment."
  - `AddressSearch` component centered on the page
  - Trust indicators below the search bar:
  "Powered by NOAA · NASA · FEMA · USGS"
  - Manage `report` state (null initially)
  - On form submit: call `analyzeAddress`, set state on success
  - When `report` is populated: scroll down and render the dashboard



### Step 57 — Commit: Address Search UI

```bash
git add .
git commit -m "feat(frontend): add address search component, API client, and TypeScript types"
```

---



### Step 58 — Create the Risk Dashboard Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/risk-dashboard
```



### Step 59 — Build the Score Card Component

- [ ] Create `frontend/src/components/dashboard/ScoreCard.tsx`:
  - Props: `hazard: string`, `icon: string`, `score: number`,
  `severity: Severity`, `factors: string[]`
  - Visual: a horizontal progress bar or arc gauge, 0–100 scale
  - Color-coded fill by severity using design system tokens
  - Score displayed as a large number (e.g., "82 / 100")
  - Expandable "Risk Factors" section revealing the `primary_factors` list



### Step 60 — Build the Verdict Badge Component

- [ ] Create `frontend/src/components/dashboard/VerdictBadge.tsx`:
  - Props: `verdict: Verdict`, `overallScore: number`
  - Large badge: "✅ Go" / "⚠️ Caution" / "🚫 Avoid"
  - Background color matches verdict: green, amber, red
  - Sub-line: "Overall Climate Risk Score: 74 / 100"
  - Brief explanation: e.g., "Extreme cumulative climate exposure detected"



### Step 61 — Build the Loading Skeleton Component

- [ ] Create `frontend/src/components/dashboard/LoadingSkeleton.tsx`:
  - Mimics the exact layout of the full dashboard (badge + 4 cards)
  - Uses `animate-pulse` Tailwind class for shimmering grey placeholder blocks
  - Displayed while the API response is pending



### Step 62 — Build the Risk Dashboard Component

- [ ] Create `frontend/src/components/dashboard/RiskDashboard.tsx`:
  - Props: `report: ClimateRiskReport`
  - Top section: formatted address, date generated
  - `VerdictBadge` displayed prominently
  - 2×2 grid of `ScoreCard` components (Flood, Hurricane, Heat, Wildfire)
  - Data attribution footer:
  "Risk data sourced from NOAA, NASA EarthData, FEMA NFHL, and USGS."
  - "Download Report" button (visually present but non-functional — enabled v1.0)
  - "Analyze Another Address" button clears state and scrolls back to the top



### Step 63 — Wire Everything Together on the Home Page

- [ ] Update `frontend/src/app/page.tsx`:
  - Show `LoadingSkeleton` while the API call is in progress
  - Show `RiskDashboard` when report data is available
  - Show the `AddressSearch` component again below the dashboard so users can
  run a new analysis without reloading the page



### Step 64 — Commit: Risk Dashboard

```bash
git add .
git commit -m "feat(frontend): build risk dashboard with score cards, verdict badge, and loading skeleton"
```

---



### Step 65 — Create the Static Pages Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/about-pricing-pages
```



### Step 66 — Create the About Page

- [ ] Create `frontend/src/app/about/page.tsx`:
  - Platform mission statement
  - Data source section: explain NOAA, NASA, FEMA, USGS and what each
  contributes to the risk scores
  - Scoring methodology overview: how the 0–100 scores and verdict are calculated
  - Team placeholder section



### Step 67 — Create the Pricing Page

- [ ] Create `frontend/src/app/pricing/page.tsx`:
  - Three-column pricing table: Individual ($49/mo), Professional ($99/mo),
  Business ($500–$5,000/mo)
  - Feature comparison rows per tier
  - "Get Started" CTA buttons (non-functional placeholder — enabled in v2.0)
  - Enterprise tier contact form link at the bottom



### Step 68 — Commit: Static Pages

```bash
git add .
git commit -m "feat(frontend): add about and pricing pages with feature comparison table"
```

---



### Step 69 — Merge v0.3-alpha Features and Tag

- [ ] Push all v0.3-alpha branches to GitHub
- [ ] Open and merge PRs in this order:
  1. `feature/app-layout` → `develop`
  2. `feature/address-search-ui` → `develop`
  3. `feature/risk-dashboard` → `develop`
  4. `feature/about-pricing-pages` → `develop`
- [ ] Pull updated `develop` and tag:
  ```bash
  git checkout develop
  git pull origin develop
  git tag -a v0.3-alpha -m "v0.3-alpha: complete frontend with address search, risk dashboard, and verdict badge"
  git push origin v0.3-alpha
  ```

> ✅ **v0.3-alpha Complete.** A working full-stack app: user enters an address,
> the backend geocodes it and scores four hazards, and the frontend renders a
> complete dashboard with a Go/Caution/Avoid verdict. No AI summaries yet.

---

---



## v1.0-MVP — Full MVP Release

> **Scope Lock:** This version adds AI-generated risk summaries, a printable
> report view, end-to-end tests, and production deployment with monitoring.
> No user accounts. No payment processing. No saved properties.

---



### Step 70 — Create the AI Summaries Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ai-risk-summaries
```



### Step 71 — Design the AI Summary Prompt

- [ ] Create `backend/app/services/ai/prompt_builder.py`:
  - Function takes a `ClimateRiskReport` and builds a system prompt + user prompt
  - The system prompt instructs the model to:
    - Act as a senior climate risk analyst writing for property investors
    - Be factual, direct, and cite contributing risk factors by name
    - Stay between 150–250 words
  - The user prompt includes: all four scores, verdict, top risk factors,
  and the formatted address
  - The prompt explicitly requests:
    - Plain-English summary of all four hazard scores
    - The single biggest risk driver for this specific address
    - A forward-looking statement: "Over the next 10–30 years..."
    - A restatement of the Go/Caution/Avoid verdict with justification
    - A closing data attribution line



### Step 72 — Build the AI Summary Generation Service

- [ ] Create `backend/app/services/ai/summary_generator.py`:
  ```python
  from openai import AsyncOpenAI
  from app.core.config import settings
  from app.schemas.risk import ClimateRiskReport
  from app.services.ai.prompt_builder import build_risk_prompt

  client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

  async def generate_risk_summary(report: ClimateRiskReport) -> str:
      system_prompt, user_prompt = build_risk_prompt(report)

      response = await client.chat.completions.create(
          model="gpt-4o-mini",
          messages=[
              {"role": "system", "content": system_prompt},
              {"role": "user",   "content": user_prompt},
          ],
          max_tokens=400,
          temperature=0.3,
      )

      return response.choices[0].message.content
  ```



### Step 73 — Integrate AI Summary into the `/analyze` Endpoint

- [ ] Update `backend/app/api/v1/endpoints/risk.py`:
  - After `build_risk_report()` returns the report, call
  `generate_risk_summary(report)` and attach the result to `report.ai_summary`
  - Wrap the AI call in a `try/except` so a summary failure does not crash the
  entire analysis — fall back to `ai_summary=None` on failure



### Step 74 — Build the AI Summary Frontend Component

- [ ] Create `frontend/src/components/dashboard/AISummary.tsx`:
  - Section header: "AI Risk Analysis"
  - "AI-Generated" badge
  - Rendered summary text
  - Disclaimer: "This summary is AI-generated and based on publicly available
  climate data. It does not constitute professional financial or legal advice."
- [ ] Add `AISummary` to `RiskDashboard.tsx`, displayed below the four score cards
- [ ] If `ai_summary` is null/undefined, render nothing (graceful degradation)



### Step 75 — Manually Validate AI Summary Quality

- [ ] Test with at least five diverse U.S. addresses and verify the summaries:
  - Miami Beach, FL — should flag flooding and hurricane as dominant risks
  - Denver, CO — should note low hurricane/flood risk, moderate heat
  - Paradise, CA — should flag extreme wildfire risk
  - Phoenix, AZ — should flag severe heat risk
  - Iowa City, IA — should note riverine flood risk
- [ ] Log any hallucinations, factual errors, or confusing language
- [ ] Iterate on the prompt in `prompt_builder.py` until summaries pass manual
  ```
  review for all five test cases
  ```



### Step 76 — Commit: AI Risk Summaries

```bash
git add .
git commit -m "feat(ai): integrate OpenAI GPT-4o-mini for AI-generated climate risk summaries"
```

---



### Step 77 — Create the Report Export Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/basic-report-export
```



### Step 78 — Build the Printable Report Page

- [ ] Create `frontend/src/app/report/page.tsx`:
  - Reads the current report from `sessionStorage` or URL query params
  - Stripped-down, print-optimized layout — no Header/Footer nav
  - Includes: property address, date, all four scores with severity labels,
  Go/Caution/Avoid verdict, AI summary (if present), data attribution
  - "🖨 Print / Save as PDF" button triggers `window.print()`
  - `@media print` CSS: hide the print button, remove all padding/margin, ensure
  everything fits cleanly across one or two pages



### Step 79 — Link the Dashboard to the Report Page

- [ ] Update the "Download Report" button in `RiskDashboard.tsx`:
  - Save the current report to `sessionStorage` with a keyed entry
  - Navigate to `/report` on click
- [ ] Test the print flow in Chrome, Firefox, and Safari



### Step 80 — Commit: Report Export

```bash
git add .
git commit -m "feat(reports): add printable HTML report page with print-to-PDF support"
```

---



### Step 81 — Set Up End-to-End Testing

```bash
git checkout develop
git pull origin develop
git checkout -b testing/e2e-mvp
```



### Step 82 — Install and Configure Playwright

- [ ] Install Playwright in the frontend:
  ```bash
  cd frontend
  npm install -D @playwright/test
  npx playwright install
  ```
- [ ] Create `frontend/playwright.config.ts` with:
  - `baseURL: 'http://localhost:3000'`
  - `testDir: './tests/e2e'`
  - Reporter: `list` for local, `github` for CI



### Step 83 — Write E2E Test Scenarios

- [ ] Create `frontend/tests/e2e/address-search.spec.ts`:
  - Test 1: Home page loads, search input is visible and focusable
  - Test 2: Valid address submission → loading skeleton appears → dashboard renders
  with 4 score cards visible
  - Test 3: Invalid address submission → error message displayed below input
  - Test 4: `VerdictBadge` contains text "Go", "Caution", or "Avoid"
  - Test 5: "View Full Report" button navigates to `/report`
  - Test 6: Report page shows the address and at least one hazard score label
  - Test 7: "Analyze Another Address" button resets the dashboard



### Step 84 — Run All Tests and Fix All Failures

- [ ] Run backend unit tests: `pytest backend/tests/ -v`
- [ ] Run E2E tests: `cd frontend && npx playwright test`
- [ ] Fix every failing test before moving to deployment
- [ ] Ensure backend scoring test coverage is ≥ 80%



### Step 85 — Commit: E2E Tests

```bash
git add .
git commit -m "test: add Playwright E2E tests for address search, risk dashboard, and report export"
```

---



### Step 86 — Production Deployment Setup

```bash
git checkout develop
git pull origin develop
git checkout -b chore/production-setup
```



### Step 87 — Provision Cloud Infrastructure

- [ ] **Frontend:** Connect the GitHub repo to Vercel; set it to auto-deploy
  ```
  from `main`
  ```
- [ ] **Backend:** Deploy FastAPI to AWS Elastic Beanstalk, AWS ECS, or Google
  ```
  Cloud Run — choose based on team familiarity
  ```
- [ ] **Database:** Provision a managed PostgreSQL instance on AWS RDS,
  ```
  Supabase, or Google Cloud SQL
  ```



### Step 88 — Configure Production Environment Variables

- [ ] Set all secrets in the cloud provider's secret manager (never in code):
  - `DATABASE_URL`, `GOOGLE_MAPS_API_KEY`, `OPENAI_API_KEY`, `NOAA_API_KEY`
- [ ] Set `NEXT_PUBLIC_API_URL` in Vercel to point to the live backend URL
- [ ] Update the backend CORS `allow_origins` list to include the production
  ```
  frontend domain
  ```



### Step 89 — Configure Domain and SSL

- [ ] Purchase a domain (e.g., `climaterisk.io`)
- [ ] Point DNS to Vercel for the frontend
- [ ] Point DNS to your cloud provider for the backend API
- [ ] Verify SSL/TLS certificates are active on both subdomains



### Step 90 — Run Database Migrations on Production

```bash
# From the backend directory, targeting the production DATABASE_URL
alembic upgrade head
```



### Step 91 — Set Up Error Monitoring (Sentry)

- [ ] Create a free Sentry.io account and two projects: one for FastAPI, one
  ```
  for Next.js
  ```
- [ ] Install and configure `sentry-sdk` in the FastAPI backend
- [ ] Install and configure `@sentry/nextjs` in the Next.js frontend
- [ ] Trigger a test error in each environment and confirm it appears in the
  ```
  Sentry dashboard
  ```



### Step 92 — Add the GitHub Actions Deployment Workflow

- [ ] Create `.github/workflows/deploy.yml`:
  - Trigger: push to `main` only
  - Job 1: run backend tests (`pytest`) before deploying
  - Job 2: deploy frontend to Vercel via Vercel CLI
  - Job 3: deploy backend to your cloud provider



### Step 93 — Commit: Production Configuration

```bash
git add .
git commit -m "chore: add production deployment config, Sentry error monitoring, and deploy GitHub Actions workflow"
```

---



### Step 94 — Pre-Launch QA Checklist

- [ ] Test 10 diverse addresses in the **production** environment — not local
- [ ] Verify AI summaries load within 10 seconds
- [ ] Verify all four score cards render with the correct color coding
- [ ] Verify the print/PDF export produces a clean, readable document
- [ ] Verify `GET /health` returns `200 OK` from the production backend URL
- [ ] Verify no raw error messages or stack traces are exposed to the user
- [ ] Verify the "Analyze Another Address" reset flow works correctly
- [ ] Verify Sentry captures errors when you intentionally break a request
- [ ] Finalize and update `README.md` with production URLs and full setup guide
- [ ] Update `CHANGELOG.md` with the v1.0 release entry



### Step 95 — Merge `develop` into `main` and Tag v1.0.0

```bash
# Merge all remaining v1.0 branches into develop first, then:
git checkout main
git pull origin main
git merge develop --no-ff -m "release: v1.0.0 MVP"
git tag -a v1.0.0 -m "v1.0.0: full MVP with risk scoring, AI summaries, report export, and production deployment"
git push origin main
git push origin v1.0.0
```

> ✅ **v1.0-MVP Complete.** Publicly deployed, production-grade application.
> Users enter any U.S. address and receive four climate risk scores, a
> Go/Caution/Avoid verdict, an AI-generated summary, and a printable report.

---

---



## v2.0 — Paid Product

> **Scope Lock:** This version adds user authentication, saved properties,
> server-generated PDF reports, historical trend data, an interactive map,
> and Stripe subscription billing. No multi-tenant enterprise features yet.

---



### Step 96 — User Authentication

```bash
git checkout develop && git pull origin develop
git checkout -b feature/user-auth
```

- [ ] Install and configure NextAuth.js with email/password and Google OAuth providers
- [ ] Create `User` SQLAlchemy model with Alembic migration
- [ ] Build: Sign Up page, Sign In page, Sign Out handler
- [ ] Protect `/report` and future saved-property routes: redirect unauthenticated
  ```
  users to Sign In
  ```
- [ ] For unauthenticated users: cap usage at 3 analyses per day (IP-based)
- [ ] **Commit:**
  ```bash
  git add . && git commit -m "feat(auth): add user authentication with NextAuth, email/password, and Google OAuth"
  ```



### Step 97 — Saved Properties

```bash
git checkout develop && git pull origin develop
git checkout -b feature/saved-properties
```

- [ ] Create `Property` SQLAlchemy model linked to `User` (FK) with Alembic migration
- [ ] Backend endpoints: `POST /properties`, `GET /properties`,
  ```
  `DELETE /properties/{id}`
  ```
- [ ] Frontend: "Save This Property" button on the dashboard (requires sign-in;
  ```
  unauthenticated users see a prompt to create an account)
  ```
- [ ] Frontend: "My Properties" page listing saved analyses with last-updated date
  ```
  and quick re-run option
  ```
- [ ] **Commit:**
  ```bash
  git add . && git commit -m "feat(properties): add saved properties dashboard with user-scoped CRUD"
  ```



### Step 98 — Full Server-Side PDF Reports

```bash
git checkout develop && git pull origin develop
git checkout -b feature/pdf-reports
```

- [ ] Add PDF generation to the backend (use `weasyprint` or Puppeteer via a
  ```
  serverless function) to convert the report HTML to a PDF
  ```
- [ ] Store generated PDFs in an S3 bucket or Google Cloud Storage; return a
  ```
  signed URL to the frontend
  ```
- [ ] Add the PDF to the `Property` model as an optional `pdf_url` field
- [ ] Frontend: "Download PDF" button for authenticated subscribers; show an
  ```
  upgrade prompt for free users
  ```
- [ ] **Commit:**
  ```bash
  git add . && git commit -m "feat(reports): add server-side PDF generation with cloud storage and signed download URLs"
  ```



### Step 99 — Historical Risk Trends

```bash
git checkout develop && git pull origin develop
git checkout -b feature/historical-trends
```

- [ ] Extend data services to return historical scores at 2000, 2010, and 2020
  ```
  checkpoints (in addition to current)
  ```
- [ ] Add `historical_trend: list[TrendPoint]` to the `ClimateRiskReport` schema
- [ ] Frontend: Line chart (Recharts) showing the four hazard scores over time
  ```
  with future projections at 2030, 2040, 2050
  ```
- [ ] **Commit:**
  ```bash
  git add . && git commit -m "feat(trends): add historical risk trend data and timeline chart with future projections"
  ```



### Step 100 — Interactive Property Map

```bash
git checkout develop && git pull origin develop
git checkout -b feature/interactive-map
```

- [ ] Integrate Mapbox GL JS (or Google Maps JavaScript API) into the dashboard
- [ ] Display the analyzed property as a risk-colored pin on the map
- [ ] Overlay FEMA flood zone polygon layer on the map for context
- [ ] **Commit:**
  ```bash
  git add . && git commit -m "feat(map): add interactive Mapbox property map with FEMA flood zone overlay"
  ```



### Step 101 — Stripe Subscription Billing

```bash
git checkout develop && git pull origin develop
git checkout -b feature/stripe-billing
```

- [ ] Create Stripe account; configure three Products and Prices (Individual,
  ```
  Professional, Business)
  ```
- [ ] Backend: Stripe webhook endpoint to handle `checkout.session.completed`,
  ```
  `customer.subscription.deleted`, and `invoice.payment_failed` events
  ```
- [ ] Attach Stripe `customer_id` and `subscription_tier` to the `User` model
- [ ] Frontend: Pricing page CTA buttons now link to Stripe Checkout
- [ ] Enforce feature gates by subscription tier:
  ```
  - Free: 3 analyses/day, no save, no PDF download
  - Individual: 50 analyses/month, save up to 25 properties, PDF download
  - Professional: 200 analyses/month, unlimited saves, PDF download, trend charts
  - Business: unlimited analyses, team access, all features
  ```
- [ ] **Commit:**
  ```bash
  git add . && git commit -m "feat(billing): integrate Stripe subscriptions with tier-based feature gating"
  ```



### Step 102 — Merge v2.0 and Tag

- [ ] Merge all v2.0 feature branches into `develop`
- [ ] Run the full regression test suite; fix any failures
- [ ] Merge `develop` into `main` and tag:
  ```bash
  git checkout main
  git merge develop --no-ff -m "release: v2.0.0"
  git tag -a v2.0.0 -m "v2.0.0: paid product with auth, saved properties, PDF reports, map, and Stripe billing"
  git push origin main && git push origin v2.0.0
  ```

> ✅ **v2.0 Complete.** Full paid SaaS product with subscriptions, user
> accounts, saved properties, server-generated PDF reports, historical trend
> charts, and an interactive flood-zone map.

---

---



## v3.0 — Enterprise Product

> **Scope Lock:** This version adds portfolio-level analysis, custom risk model
> configuration, a public API with key-based authentication and rate limiting,
> insurance cost estimates, and enterprise white-label reporting.

---



### Step 103 — Portfolio Analysis Engine

```bash
git checkout develop && git pull origin develop
git checkout -b feature/portfolio-analysis
```

- [ ] Build a CSV bulk upload endpoint: accept up to 1,000 addresses per file
- [ ] Process the portfolio as a background job (Celery + Redis, or FastAPI
  ```
  `BackgroundTasks` for smaller workloads)
  ```
- [ ] Frontend: Portfolio dashboard showing a heatmap of all addresses by risk
  ```
  level, a "Top 10 Worst Exposures" table, and a concentration risk breakdown
  by hazard type
  ```
- [ ] **Commit:**
  ```bash
  git add . && git commit -m "feat(portfolio): add bulk CSV upload and portfolio analysis with heatmap dashboard"
  ```



### Step 104 — Custom Risk Model Weights

```bash
git checkout develop && git pull origin develop
git checkout -b feature/custom-risk-models
```

- [ ] Allow enterprise users to configure hazard weighting (e.g., increase
  ```
  hurricane weight for a coastal-heavy portfolio, increase wildfire for
  California-focused portfolios)
  ```
- [ ] Store custom model configurations per organization in the database
- [ ] Re-run reports using the custom weights when a saved configuration is active
- [ ] **Commit:**
  ```bash
  git add . && git commit -m "feat(enterprise): add custom risk model weight configuration per organization"
  ```



### Step 105 — Public REST API with API Key Authentication

```bash
git checkout develop && git pull origin develop
git checkout -b feature/public-api
```

- [ ] Build API key generation and revocation for users/organizations (stored
  ```
  hashed in the database)
  ```
- [ ] Add API key middleware that reads `X-API-Key` header on all `/api/v1/`
  ```
  routes
  ```
- [ ] Implement rate limiting per API key:
  ```
  - Free tier: 100 requests/day
  - Paid tiers: per-plan limits defined in subscription config
  ```
- [ ] Auto-generate OpenAPI/Swagger documentation via FastAPI's built-in support
- [ ] Create an API Keys management page in the user dashboard
- [ ] **Commit:**
  ```bash
  git add . && git commit -m "feat(api): add public REST API with API key auth, rate limiting, and Swagger docs"
  ```



### Step 106 — Insurance Cost Estimates

```bash
git checkout develop && git pull origin develop
git checkout -b feature/insurance-estimates
```

- [ ] Research NFIP flood insurance rate tables and private market trend data
  ```
  by FEMA flood zone and state
  ```
- [ ] Build a service that maps hazard scores and flood zones to estimated
  ```
  annual premium ranges
  ```
- [ ] Add `insurance_estimate` field to the `ClimateRiskReport` schema
- [ ] Display the estimate section in the dashboard and PDF report with a
  ```
  clear disclaimer ("Estimated range only — contact a licensed insurer for
  a precise quote")
  ```
- [ ] **Commit:**
  ```bash
  git add . && git commit -m "feat(insurance): add insurance cost estimate ranges to risk reports"
  ```



### Step 107 — Enterprise White-Label Reporting

```bash
git checkout develop && git pull origin develop
git checkout -b feature/enterprise-reporting
```

- [ ] Build a "Board-Ready Executive Summary" PDF mode: high-level language,
  ```
  no technical scoring detail, suitable for board or investor presentation
  ```
- [ ] Allow enterprise organizations to upload a logo and set brand colors;
  ```
  apply them to all generated PDF reports
  ```
- [ ] Add a portfolio-level CSV export containing all property addresses, scores,
  ```
  verdicts, and insurance estimates for import into Excel or BI tools
  ```
- [ ] **Commit:**
  ```bash
  git add . && git commit -m "feat(enterprise): add white-label PDF reporting, brand config, and portfolio CSV export"
  ```



### Step 108 — Merge v3.0 and Tag

- [ ] Merge all v3.0 feature branches into `develop`
- [ ] Run the full regression suite; conduct a load test on the public API
  ```
  endpoint targeting ≥ 200 concurrent requests
  ```
- [ ] Merge `develop` into `main` and tag:
  ```bash
  git checkout main
  git merge develop --no-ff -m "release: v3.0.0"
  git tag -a v3.0.0 -m "v3.0.0: enterprise product with portfolio analysis, public API, custom models, and insurance estimates"
  git push origin main && git push origin v3.0.0
  ```

> ✅ **v3.0 Complete.** Enterprise-grade climate risk intelligence platform
> capable of portfolio-scale analysis, a developer-facing public API, custom
> risk model configuration, insurance estimation, and white-label reporting.

---



## Version Summary


| Version    | Status        | Key Deliverable                                        |
| ---------- | ------------- | ------------------------------------------------------ |
| v0.1-alpha | ⬜ Not Started | Monorepo scaffolding, Docker, CI pipeline              |
| v0.2-alpha | ⬜ Not Started | Geocoding, climate data APIs, risk scoring engine      |
| v0.3-alpha | ⬜ Not Started | Full frontend: search, dashboard, score cards, verdict |
| v1.0.0     | ⬜ Not Started | AI summaries, printable reports, production deploy     |
| v2.0.0     | ⬜ Not Started | Auth, saved properties, PDF, maps, Stripe billing      |
| v3.0.0     | ⬜ Not Started | Portfolio, public API, custom models, insurance        |


