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

## 12-Week Learning & Build Roadmap
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
`
make setup   # create virtualenv, install backend deps
make api     # run FastAPI with automatic reload
make ui      # install npm deps and start Vite dev server
make test    # run backend pytest suite
make lint    # run Ruff and mypy checks
`

## Contribution Guidelines
- **Branching:** Use feature branches prefixed with your area, e.g. eat/forecast-ensemble, ix/ui-loading-state.
- **Pull Requests:** Keep PRs focused, link issues, document testing evidence, and request at least one review.
- **Coding Standards:**
  - Backend uses Ruff (PEP8 + additional rules) and mypy in strict mode.
  - Frontend follows ESLint with standard-with-typescript config and Prettier defaults.
  - Write meaningful docstrings and component-level comments when the logic is non-trivial.
- **Testing:**
  - Add or update unit tests for each feature (ackend/tests).
  - Provide integration tests for new API contracts (ackend/tests/test_api_integration.py).
  - Use sample data under ackend/data/sample_data for deterministic reproducibility.
- **Community:** Follow the MIT license, respect the Code of Conduct (TBD), and document major design decisions in ADRs or the project wiki.

Happy shipping!
