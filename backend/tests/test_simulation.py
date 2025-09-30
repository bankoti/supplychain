from __future__ import annotations

from backend.engines.simulation import run_single_item_simulation


def test_simulation_reports_stockouts() -> None:
    report = run_single_item_simulation(
        demand_profile=[40, 60, 80, 100],
        initial_inventory=120,
        reorder_point=60,
        order_quantity=100,
        lead_time=2,
        seed=42,
    )

    assert report.demand_served > 0
    assert report.demand_lost >= 0
    assert report.stockouts


def test_simulate_inventory_endpoint(client) -> None:
    response = client.post(
        "/inventory/simulate",
        json={
            "demand_profile": [40, 60, 80, 100],
            "initial_inventory": 120,
            "reorder_point": 60,
            "order_quantity": 100,
            "lead_time": 2,
            "seed": 1,
        },
    )
    payload = response.json()
    assert response.status_code == 200
    assert payload["demand_served"] > 0
    assert isinstance(payload["stockouts"], list)