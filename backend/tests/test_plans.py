from __future__ import annotations

from pathlib import Path
from typing import Iterator

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app


@pytest.fixture()
def tmp_plans_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Path]:
    plans_path = tmp_path / "plans.json"
    plans_path.write_text("[]", encoding="utf-8")
    monkeypatch.setenv("SUPPLYCHAINOS_PLANS_PATH", str(plans_path))
    yield plans_path


@pytest.fixture()
def plans_client(tmp_plans_file: Path) -> TestClient:  # noqa: ARG001
    return TestClient(app)


def test_create_and_list_plans(plans_client: TestClient) -> None:
    create_payload = {
        "name": "Scenario Alpha",
        "description": "Pilot plan",
        "tasks": [
            {"id": "task-1", "title": "Collect data", "status": "todo"},
            {"id": "task-2", "title": "Train model", "status": "in_progress"},
        ],
    }

    response = plans_client.post("/plans/", json=create_payload)
    assert response.status_code == 201
    plan = response.json()
    assert plan["name"] == "Scenario Alpha"

    list_response = plans_client.get("/plans/")
    assert list_response.status_code == 200
    items = list_response.json()
    assert len(items) == 1
    assert items[0]["tasks"][0]["title"] == "Collect data"


def test_update_and_delete_plan(plans_client: TestClient) -> None:
    response = plans_client.post(
        "/plans/",
        json={"name": "Beta", "tasks": []},
    )
    plan_id = response.json()["id"]

    update_response = plans_client.put(
        f"/plans/{plan_id}",
        json={
            "description": "Updated",
            "tasks": [{"id": "t1", "title": "Task", "status": "done"}],
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["description"] == "Updated"
    assert updated["tasks"][0]["status"] == "done"

    delete_response = plans_client.delete(f"/plans/{plan_id}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"deleted": True}

    list_response = plans_client.get("/plans/")
    assert list_response.json() == []