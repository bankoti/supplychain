from __future__ import annotations

from typing import List

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.data.adapters.sample_loader import load_demand_series


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def sample_series() -> List[float]:
    return load_demand_series("SKU-001", "LOC-001")