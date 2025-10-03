from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from backend.data import supply_plan_repository
from backend.data.models import (
    SupplyPlanCreateRequest,
    SupplyPlanModel,
    SupplyPlanUpdateRequest,
)

router = APIRouter()


@router.get("/", response_model=list[SupplyPlanModel])
def list_supply_plans() -> list[SupplyPlanModel]:
    return supply_plan_repository.list_supply_plans()


@router.get("/{plan_id}", response_model=SupplyPlanModel)
def get_supply_plan(plan_id: str) -> SupplyPlanModel:
    plan = supply_plan_repository.get_supply_plan(plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supply plan not found")
    return plan


@router.post("/", response_model=SupplyPlanModel, status_code=status.HTTP_201_CREATED)
def create_supply_plan(payload: SupplyPlanCreateRequest) -> SupplyPlanModel:
    return supply_plan_repository.create_supply_plan(payload)


@router.put("/{plan_id}", response_model=SupplyPlanModel)
def update_supply_plan(plan_id: str, payload: SupplyPlanUpdateRequest) -> SupplyPlanModel:
    plan = supply_plan_repository.update_supply_plan(plan_id, payload)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supply plan not found")
    return plan


@router.delete("/{plan_id}")
def delete_supply_plan(plan_id: str) -> dict[str, bool]:
    deleted = supply_plan_repository.delete_supply_plan(plan_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supply plan not found")
    return {"deleted": True}
