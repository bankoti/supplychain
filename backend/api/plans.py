from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from backend.data import plans_repository
from backend.data.models import (
    PlanCreateRequest,
    PlanModel,
    PlanUpdateRequest,
    TaskModel,
)

router = APIRouter()


@router.get("/", response_model=list[PlanModel])
def list_plans() -> list[PlanModel]:
    return plans_repository.list_plans()


@router.get("/{plan_id}", response_model=PlanModel)
def get_plan(plan_id: str) -> PlanModel:
    plan = plans_repository.get_plan(plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


@router.post("/", response_model=PlanModel, status_code=status.HTTP_201_CREATED)
def create_plan(payload: PlanCreateRequest) -> PlanModel:
    tasks = [TaskModel(**task.model_dump()) for task in payload.tasks]
    return plans_repository.create_plan(payload.name, payload.description, tasks)


@router.put("/{plan_id}", response_model=PlanModel)
def update_plan(plan_id: str, payload: PlanUpdateRequest) -> PlanModel:
    plan = plans_repository.update_plan(plan_id, payload)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


@router.delete("/{plan_id}")
def delete_plan(plan_id: str) -> dict[str, bool]:
    deleted = plans_repository.delete_plan(plan_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return {"deleted": True}