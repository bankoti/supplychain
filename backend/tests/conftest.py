from __future__ import annotations

from typing import List

import pytest

from backend.data.adapters.sample_loader import load_demand_series


@pytest.fixture(scope="session")
def sample_series() -> List[float]:
    return load_demand_series("SKU-001", "LOC-001")