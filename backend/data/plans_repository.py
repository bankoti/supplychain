from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

from backend.data.models import PlanModel, PlanUpdateRequest, TaskModel

_DEFAULT_PATH = Path(__file__).resolve().parent / "sample_data" / "plans.json"


def _store_path() -> Path:
    return Path(os.getenv("SUPPLYCHAINOS_PLANS_PATH", str(_DEFAULT_PATH)))


def _ensure_store(path: Path) -> None:
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("[]", encoding="utf-8")


def _load_raw() -> List[Dict]:
    path = _store_path()
    _ensure_store(path)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def _dump_raw(plans: List[Dict]) -> None:
    path = _store_path()
    path.write_text(json.dumps(plans, indent=2, ensure_ascii=False), encoding="utf-8")


def list_plans() -> List[PlanModel]:
    return [PlanModel(**item) for item in _load_raw()]


def get_plan(plan_id: str) -> PlanModel | None:
    for item in _load_raw():
        if item.get("id") == plan_id:
            return PlanModel(**item)
    return None


def save_plan(plan: PlanModel) -> PlanModel:
    raw = _load_raw()
    updated = False
    for index, item in enumerate(raw):
        if item.get("id") == plan.id:
            raw[index] = plan.model_dump()
            updated = True
            break
    if not updated:
        raw.append(plan.model_dump())
    _dump_raw(raw)
    return plan


def create_plan(name: str, description: str | None, tasks: List[TaskModel]) -> PlanModel:
    now = datetime.now(timezone.utc).isoformat()
    plan_id = _generate_identifier(name)
    plan = PlanModel(
        id=plan_id,
        name=name,
        description=description,
        created_at=now,
        updated_at=now,
        tasks=tasks,
    )
    save_plan(plan)
    return plan


def update_plan(plan_id: str, payload: PlanUpdateRequest) -> PlanModel | None:
    existing = get_plan(plan_id)
    if existing is None:
        return None

    data = existing.model_dump()
    if payload.name is not None:
        data["name"] = payload.name
    if payload.description is not None:
        data["description"] = payload.description
    if payload.tasks is not None:
        data["tasks"] = [task.model_dump() for task in payload.tasks]
    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    plan = PlanModel(**data)
    save_plan(plan)
    return plan


def delete_plan(plan_id: str) -> bool:
    raw = _load_raw()
    new_items = [item for item in raw if item.get("id") != plan_id]
    if len(new_items) == len(raw):
        return False
    _dump_raw(new_items)
    return True


def _generate_identifier(name: str) -> str:
    sanitized = name.lower().strip().replace(" ", "-")
    base = sanitized[:24] if sanitized else "plan"
    existing = {plan.id for plan in list_plans()}
    candidate = base
    i = 1
    while candidate in existing:
        candidate = f"{base}-{i}"
        i += 1
    return candidate