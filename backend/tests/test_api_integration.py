from __future__ import annotations

from fastapi.testclient import TestClient

from backend.api.main import app
from backend.data.adapters.sample_loader import load_demand_series

client = TestClient(app)


def test_forecast_endpoint_returns_forecast() -> None:
    series = load_demand_series("SKU-001", "LOC-001")
    response = client.post(
        "/forecast/run",
        json={"method": "naive", "series": series, "horizon": 3},
    )
    payload = response.json()
    assert response.status_code == 200
    assert len(payload["forecast"]) == 3


def test_inventory_policy_endpoint() -> None:
    response = client.post(
        "/inventory/policy",
        json={
            "method": "eoq",
            "annual_demand": 12000,
            "ordering_cost": 150,
            "holding_cost": 3,
        },
    )
    payload = response.json()
    assert response.status_code == 200
    assert payload["policy"]["order_quantity"] > 0


def test_bullwhip_endpoint() -> None:
    response = client.post(
        "/bullwhip/diagnostics",
        json={
            "demand": [100, 110, 120, 115, 130],
            "orders": [105, 120, 135, 125, 140],
        },
    )
    payload = response.json()
    assert response.status_code == 200
    assert payload["amplification_index"] >= 1


def test_kpi_summary_endpoint() -> None:
    response = client.get("/kpi/summary")
    payload = response.json()
    assert response.status_code == 200
    assert 0 <= payload["fill_rate"] <= 1