PYTHON ?= python
VENV_DIR := .venv
VENV_BIN := $(VENV_DIR)/bin
PYTHON_BIN := $(VENV_BIN)/python

ifeq ($(OS),Windows_NT)
	VENV_BIN := $(VENV_DIR)/Scripts
	PYTHON_BIN := $(VENV_BIN)/python.exe
endif

.PHONY: setup api ui test lint format clean docker

setup:
	$(PYTHON) -m venv $(VENV_DIR)
	$(PYTHON_BIN) -m pip install --upgrade pip
	$(PYTHON_BIN) -m pip install -r backend/requirements.txt

api:
	$(PYTHON_BIN) -m uvicorn backend.api.main:app --reload --port 8000

ui:
	cd frontend && npm install && npm run dev

test:
	$(PYTHON_BIN) -m pytest backend/tests -v

lint:
	$(PYTHON_BIN) -m ruff check backend
	$(PYTHON_BIN) -m mypy backend

format:
	$(PYTHON_BIN) -m ruff check backend --fix

clean:
	$(PYTHON) -c "import shutil, pathlib; shutil.rmtree('$(VENV_DIR)', ignore_errors=True)"

docker:
	cd infra/docker && docker compose up --build