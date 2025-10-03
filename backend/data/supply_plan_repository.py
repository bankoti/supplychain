from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

from backend.data.models import (
    SupplyPlanCreateRequest,
    SupplyPlanModel,
    SupplyPlanUpdateRequest,
)

_DEFAULT_PATH = Path(__file__).resolve().parent / "sample_data" / "supply_plans.json"


def _store_path() -> Path:
    return Path(os.getenv("SUPPLYCHAINOS_SUPPLY_PLANS_PATH", str(_DEFAULT_PATH)))


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


def list_supply_plans() -> List[SupplyPlanModel]:
    return [SupplyPlanModel(**item) for item in _load_raw()]


def get_supply_plan(plan_id: str) -> SupplyPlanModel | None:
    for item in _load_raw():
        if item.get("id") == plan_id:
            return SupplyPlanModel(**item)
    return None


def save_supply_plan(plan: SupplyPlanModel) -> SupplyPlanModel:
    raw = _load_raw()
    replaced = False
    for index, item in enumerate(raw):
        if item.get("id") == plan.id:
            raw[index] = plan.model_dump()
            replaced = True
            break
    if not replaced:
        raw.append(plan.model_dump())
    _dump_raw(raw)
    return plan


def create_supply_plan(payload: SupplyPlanCreateRequest) -> SupplyPlanModel:
    now = datetime.now(timezone.utc).isoformat()
    plan_id = _generate_identifier(payload.sku)

    plan = SupplyPlanModel(
        id=plan_id,
        sku=payload.sku,
        product_name=payload.product_name,
        lifecycle_stage=payload.lifecycle_stage,
        planning_horizon_start=payload.planning_horizon_start,
        planning_horizon_end=payload.planning_horizon_end,
        review_cadence=payload.review_cadence,
        status=payload.status,
        owner=payload.owner,
        version=1,
        notes=payload.notes,
        nodes=payload.nodes,
        risks=payload.risks,
        kpi_targets=payload.kpi_targets,
        created_at=now,
        updated_at=now,
    )
    return save_supply_plan(plan)


def update_supply_plan(plan_id: str, payload: SupplyPlanUpdateRequest) -> SupplyPlanModel | None:
    existing = get_supply_plan(plan_id)
    if existing is None:
        return None

    now = datetime.now(timezone.utc).isoformat()
    data = existing.model_dump()
    updates = payload.model_dump(exclude_unset=True)

    for key, value in updates.items():
        if key in {"nodes", "risks", "kpi_targets"}:
            if value is None:
                data[key] = []
            else:
                data[key] = [item if isinstance(item, dict) else item.model_dump() for item in value]
        else:
            data[key] = value

    data["version"] = data.get("version", 1) + 1
    data["updated_at"] = now

    plan = SupplyPlanModel(**data)
    return save_supply_plan(plan)


def delete_supply_plan(plan_id: str) -> bool:
    raw = _load_raw()
    remaining = [item for item in raw if item.get("id") != plan_id]
    if len(remaining) == len(raw):
        return False
    _dump_raw(remaining)
    return True


def _generate_identifier(sku: str) -> str:
    sanitized = sku.lower().strip().replace(" ", "-")
    base = sanitized[:24] if sanitized else "supply-plan"
    existing = {plan.id for plan in list_supply_plans()}
    candidate = base
    suffix = 1
    while candidate in existing:
        candidate = f"{base}-{suffix}"
        suffix += 1
    return candidate
