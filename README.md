# SupplyChainOS

SupplyChainOS is an open-source learning and experimentation platform for modern supply chain analytics. It helps developers, analysts, and educators combine forecasting, inventory, optimization, and simulation workflows into a cohesive experience that runs locally or in the cloud.

## Why SupplyChainOS?
- Unite core supply chain models (forecasting, inventory, bullwhip diagnostics, and what-if scenarios) behind a clean API and UI.
- Provide an extendable reference architecture using production-ready tools (FastAPI, React, DuckDB, OR-Tools, SimPy).
- Accelerate learning through ready-to-run scenarios, curated datasets, and a roadmap aligned with the Coursera Supply Chain Analytics Specialization.

## Product Strategy: Breadth First, Then Depth
1. **Weeks 1-4 (Breadth Pass):** Build thin vertical slices across forecasting, inventory, bullwhip, and KPI reporting. Create working FastAPI routes, UI pages, and sample data. Favor clarity, type safety, and testability over exhaustive modeling depth.
2. **Weeks 5-12 (Depth Pass):** Iterate on accuracy, stochastic modeling, optimization robustness, and richer UI/UX. Introduce multi-echelon models, reinforcement learning experiments, and scenario management once the backbone is stable.

## Architecture Overview
- **Backend:** Python 3.11, FastAPI, Pydantic v2, OR-Tools, PuLP, statsmodels, scikit-learn, numpy, pandas, SimPy. DuckDB powers local analytics with optional PostgreSQL via SQLAlchemy and psycopg2-binary.
- **Frontend:** React + TypeScript + Vite, shadcn/ui component system, recharts visualizations, TanStack Query for data fetching.
- **Data Layer:** CSV and Parquet ingestion pipelines backed by DuckDB. Adapters expose typed data sources and optional sinks (e.g., PostgreSQL).
- **Tooling:** Docker Compose for containerized development, Makefile-driven workflows, pytest + httpx for integration tests, Ruff + mypy for linting and static typing.

## Implementation Plan & Status
| Area | Scope | Status | Notes |
| ---- | ----- | ------ | ----- |
| Backend API | FastAPI app, forecasting/inventory/bullwhip/KPI routers, data models, sample CSV loaders | ✅ Completed | `make api` serves endpoints; CORS enabled for Vite dev server |
| Analytics Engines | Forecasting (naive/ETS/Croston), inventory policies (EOQ, (Q,R), newsvendor), bullwhip diagnostics | ✅ Completed | Backed by pytest unit coverage |
| Optimization & Simulation | PuLP make-to-order LP, SimPy single-item inventory simulation | ✅ Completed | Engine modules + pytest coverage (`test_optimization.py`, `test_simulation.py`) |
| Frontend Shell | React + Vite scaffold, layout & navigation, TanStack Query wiring | ✅ Completed | Pages for Dashboard, Demand, Inventory, Bullwhip, What-if render successfully |
| Data Samples | Products, locations, demand, lead times, cost baseline | ✅ Completed | Located under `backend/data/sample_data/` |
| QA & Tooling | `make test`, `make lint`, `.gitignore`, CORS fixes | ✅ Completed | Pytest + mypy + Ruff pass locally |
| Forecasting Depth (ARIMA) | Added ARIMA option to API + Demand UI support | ✅ Completed | Statsmodels ARIMA path with metrics + new test coverage |
| Inventory Depth (Simulation) | Inventory simulation API + What-if UI integration | ✅ Completed | `/inventory/simulate` endpoint + React form & results table |## 12-Week Learning & Build Roadmap
| Week | Learning Focus (Coursera Alignment) | Build Focus |
| ---- | ----------------------------------- | ----------- |
| 1 | Supply Chain Analytics overview | Scaffold repo, CI-ready tooling, sample data ingestion |
| 2 | Demand forecasting fundamentals | Implement naive/Croston/ETS endpoints and tests |
| 3 | Inventory management concepts | Implement EOQ and (Q,R) policies with simulation harness |
| 4 | Supply chain metrics & KPIs | Deliver KPI summary endpoint and dashboard wiring |
| 5 | Advanced forecasting (time-series) | Introduce ARIMA/prophet placeholders, compare accuracy |
| 6 | Network design & optimization | Model constraints with PuLP/OR-Tools, scenario configs |
| 7 | Simulation & risk analysis | Extend SimPy-based what-if experiments |
| 8 | Data engineering & pipelines | Automate DuckDB ingestion, validation suites |
| 9 | Machine learning for supply chains | Add ML-driven forecast ensembling, feature stores |
| 10 | Resiliency & bullwhip mitigation | Expand diagnostics, multi-echelon policies |
| 11 | Visualization & UX | Deepen UI interactions, experiment lab, reporting |
| 12 | Deployment & operations | Harden Docker/Kubernetes deploy, monitoring hooks |

## Developer Workflow
```
make setup   # create virtualenv, install backend deps
make api     # run FastAPI with automatic reload
make ui      # install npm deps and start Vite dev server
make test    # run backend pytest suite
make lint    # run Ruff and mypy checks
```

## Contribution Guidelines
- **Branching:** Use feature branches prefixed with your area, e.g. `feat/forecast-ensemble`, `fix/ui-loading-state`.
- **Pull Requests:** Keep PRs focused, link issues, document testing evidence, and request at least one review.
- **Coding Standards:**
  - Backend uses Ruff (PEP 8 + additional rules) and mypy in strict mode.
  - Frontend follows ESLint with `standard-with-typescript` config and Prettier defaults.
  - Write meaningful docstrings and component-level comments when the logic is non-trivial.
- **Testing:**
  - Add or update unit tests for each feature (`backend/tests`).
  - Provide integration tests for new API contracts (`backend/tests/test_api_integration.py`).
  - Use sample data under `backend/data/sample_data` for deterministic reproducibility.
- **Community:** Follow the MIT license, respect the Code of Conduct (TBD), and document major design decisions in ADRs or the project wiki.

Happy shipping!