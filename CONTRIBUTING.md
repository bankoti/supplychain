# Contributing to SupplyChainOS

Thanks for your interest in improving SupplyChainOS! This guide explains how to set up your environment, propose changes, and work with the core team.

## Development Requirements

- Python 3.11+
- Node.js 18+
- GNU Make (required for the commands in this repo)
- Docker Desktop (optional but recommended for parity with production)

## Getting Started

1. Fork the repository and clone your fork.
2. Create and activate a virtual environment: `python -m venv .venv && source .venv/Scripts/activate` (PowerShell) or `source .venv/bin/activate` (Unix).
3. Run `make setup` to install backend dependencies and development tooling.
4. Install frontend dependencies with `make ui` (installs packages and starts Vite in dev mode).
5. Execute `make test` and `make lint` to confirm everything passes before you begin.

## Branching & Issues

- Name branches with a clear prefix, e.g. `feat/`, `fix/`, `docs/`, or `chore/` followed by a short slug.
- Link GitHub issues in your pull requests and keep the scope focused. If an issue does not exist, open one before submitting a PR so we can discuss the problem and solution approach.

## Coding Standards

- Backend: follow Ruff + mypy strictness. Run `make lint` locally before pushing.
- Frontend: adhere to ESLint (`standard-with-typescript`) and Prettier defaults. Run `npm run lint` inside `frontend/` when touching UI code.
- Add unit tests for new behaviours (`backend/tests`, `frontend/src/__tests__`). For API changes, extend `backend/tests/test_api_integration.py` or create new integration tests as needed.
- Write docstrings or component-level comments when logic is complex or non-obvious.

## Pull Request Checklist

- [ ] Tests added or updated.
- [ ] `make test` and `make lint` succeed locally.
- [ ] Screenshots or GIFs for UI changes.
- [ ] Documentation updated (README, docs/adr, or inline docs) if necessary.
- [ ] Clear summary of changes and impact in the PR description.
- [ ] Request at least one reviewer from the maintainers list.

## Architecture Decision Records (ADRs)

Important technical decisions should be captured under `docs/adr/`. Use the template in `docs/adr/000-template.md` and create new records with sequential numbers (e.g., `0001-choose-forecast-engine.md`). Submit ADRs alongside or before the code changes that implement them.

## Communication

- Use GitHub Discussions for feature proposals and roadmap questions.
- Use the issue tracker for bugs, tasks, and technical debt.
- For security disclosures, email security@supplychainos.dev instead of filing a public issue.

We appreciate your contributions and look forward to building a robust supply chain analytics platform together!
