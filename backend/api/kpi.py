from __future__ import annotations

import pandas as pd
from fastapi import APIRouter

from backend.data.adapters.sample_loader import load_table
from backend.data.models import KPIResponse

router = APIRouter()


@router.get("/summary", response_model=KPIResponse)
def kpi_summary() -> KPIResponse:
    demand: pd.DataFrame = load_table("demand.csv")
    costs: pd.DataFrame = load_table("costs.csv")

    total_demand = float(demand["quantity"].sum())
    service_level = float(costs["service_level_target"].mean())

    # Assume shipped volume follows service level target.
    shipped = total_demand * service_level
    fill_rate = shipped / total_demand if total_demand else 0.0

    avg_inventory_units = float(costs["avg_inventory_units"].sum())
    inventory_turns = total_demand / avg_inventory_units if avg_inventory_units else 0.0

    holding_cost = float((costs["avg_inventory_units"] * costs["holding_cost_per_unit"]).sum())

    return KPIResponse(
        customer_service_level=round(service_level, 3),
        fill_rate=round(fill_rate, 3),
        inventory_turns=round(inventory_turns, 2),
        holding_cost=round(holding_cost, 2),
    )