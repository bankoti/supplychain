from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.data.models import (
    InventoryPolicyRequest,
    InventoryPolicyResponse,
    InventorySimulationRequest,
    InventorySimulationResponse,
    StockoutEventModel,
)
from backend.engines.inventory import compute_policy
from backend.engines.simulation import run_single_item_simulation

router = APIRouter()


@router.post("/policy", response_model=InventoryPolicyResponse)
def compute_inventory_policy(payload: InventoryPolicyRequest) -> InventoryPolicyResponse:
    return compute_policy(payload)


@router.post("/simulate", response_model=InventorySimulationResponse)
def simulate_inventory(payload: InventorySimulationRequest) -> InventorySimulationResponse:
    if not payload.demand_profile:
        raise HTTPException(status_code=400, detail="Demand profile cannot be empty.")

    report = run_single_item_simulation(
        demand_profile=payload.demand_profile,
        initial_inventory=payload.initial_inventory,
        reorder_point=payload.reorder_point,
        order_quantity=payload.order_quantity,
        lead_time=payload.lead_time,
        seed=payload.seed,
    )

    stockouts = [
        StockoutEventModel(time=event.time, shortfall=event.shortfall)
        for event in report.stockouts
    ]

    return InventorySimulationResponse(
        demand_served=report.demand_served,
        demand_lost=report.demand_lost,
        stockouts=stockouts,
    )