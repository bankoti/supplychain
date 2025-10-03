from __future__ import annotations

import json
from pathlib import Path
from typing import Iterator

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app


@pytest.fixture()
def tmp_supply_plans_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Path]:
    store = tmp_path / "supply_plans.json"
    sample = [
        {
            "id": "plan-alpha",
            "sku": "SKU-ALPHA",
            "product_name": "Alpha",
            "lifecycle_stage": "growth",
            "planning_horizon_start": "2025-10-01",
            "planning_horizon_end": "2026-03-31",
            "review_cadence": "monthly",
            "status": "active",
            "owner": "Planner One",
            "version": 1,
            "notes": "Initial baseline",
            "nodes": [
                {
                    "node_id": "dc-east",
                    "name": "East DC",
                    "demand_profile": [
                        {"period": "2025-10", "forecast_units": 500.0}
                    ],
                    "inventory_policy": {"policy_type": "qr", "reorder_point": 250.0},
                    "supply_sources": [],
                    "schedule": [],
                }
            ],
            "risks": [],
            "kpi_targets": [],
            "created_at": "2025-09-01T00:00:00Z",
            "updated_at": "2025-09-01T00:00:00Z",
        }
    ]
    store.write_text(json.dumps(sample), encoding="utf-8")
    monkeypatch.setenv("SUPPLYCHAINOS_SUPPLY_PLANS_PATH", str(store))
    yield store


@pytest.fixture()
def supply_plan_client(tmp_supply_plans_file: Path) -> TestClient:  # noqa: ARG001
    return TestClient(app)


def test_list_supply_plans(supply_plan_client: TestClient) -> None:
    response = supply_plan_client.get("/supply-plans/")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["sku"] == "SKU-ALPHA"


def test_create_supply_plan(supply_plan_client: TestClient) -> None:
    create_payload = {
        "sku": "SKU-BETA",
        "product_name": "Beta",
        "planning_horizon_start": "2025-11-01",
        "planning_horizon_end": "2026-02-28",
        "nodes": [
            {
                "node_id": "dc-west",
                "name": "West DC",
                "demand_profile": [
                    {"period": "2025-11", "forecast_units": 420.0, "confidence": 0.7}
                ],
                "inventory_policy": {
                    "policy_type": "eoq",
                    "reorder_point": 180.0,
                    "order_quantity": 300.0,
                    "service_level": 0.9
                },
                "supply_sources": [
                    {
                        "supplier_id": "SUP-01",
                        "name": "Primary Supplier",
                        "lead_time_days": 14,
                        "unit_cost": 12.5,
                        "reliability_score": 0.85
                    }
                ],
                "schedule": []
            }
        ],
        "kpi_targets": [
            {"metric": "fill_rate", "target_value": 0.95, "unit": "ratio"}
        ]
    }

    response = supply_plan_client.post("/supply-plans/", json=create_payload)
    assert response.status_code == 201
    plan = response.json()
    assert plan["sku"] == "SKU-BETA"
    assert plan["version"] == 1
    assert plan["nodes"][0]["inventory_policy"]["policy_type"] == "eoq"

    list_response = supply_plan_client.get("/supply-plans/")
    assert len(list_response.json()) == 2


def test_update_and_delete_supply_plan(supply_plan_client: TestClient) -> None:
    existing = supply_plan_client.get("/supply-plans/").json()[0]
    plan_id = existing["id"]

    update_response = supply_plan_client.put(
        f"/supply-plans/{plan_id}",
        json={"status": "archived", "notes": "Archived after migration."},
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["status"] == "archived"
    assert updated["version"] == existing["version"] + 1

    delete_response = supply_plan_client.delete(f"/supply-plans/{plan_id}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"deleted": True}

    list_response = supply_plan_client.get("/supply-plans/")
    skus = [item["sku"] for item in list_response.json()]
    assert "SKU-ALPHA" not in skus
