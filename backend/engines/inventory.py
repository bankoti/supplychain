from __future__ import annotations

from math import sqrt
from typing import Dict

from scipy.stats import norm  # type: ignore[import-untyped]

from backend.data.models import (
    InventoryMethod,
    InventoryPolicyRequest,
    InventoryPolicyResponse,
)


def _require(params: Dict[str, float | None], method: str) -> Dict[str, float]:
    missing = [name for name, value in params.items() if value is None]
    if missing:
        joined = ", ".join(missing)
        msg = f"Missing parameters for {method}: {joined}"
        raise ValueError(msg)
    return {name: float(value) for name, value in params.items() if value is not None}


def _eoq(request: InventoryPolicyRequest) -> InventoryPolicyResponse:
    values = _require(
        {
            "annual_demand": request.annual_demand,
            "ordering_cost": request.ordering_cost,
            "holding_cost": request.holding_cost,
        },
        "EOQ",
    )
    eoq = sqrt(2 * values["annual_demand"] * values["ordering_cost"] / values["holding_cost"])
    turns = values["annual_demand"] / eoq if eoq else 0.0
    policy = {
        "order_quantity": round(eoq, 2),
        "cycle_stock": round(eoq / 2, 2),
        "inventory_turns": round(turns, 2),
    }
    return InventoryPolicyResponse(policy=policy, notes="Classical Economic Order Quantity model.")


def _qr(request: InventoryPolicyRequest) -> InventoryPolicyResponse:
    values = _require(
        {
            "demand_rate": request.demand_rate,
            "lead_time": request.lead_time,
            "demand_std": request.demand_std,
        },
        "(Q,R)",
    )
    service_level = float(request.service_level or 0.95)
    z = norm.ppf(service_level)
    sigma_lt = values["demand_std"] * sqrt(values["lead_time"])
    reorder_point = values["demand_rate"] * values["lead_time"] + z * sigma_lt

    if request.annual_demand and request.ordering_cost and request.holding_cost:
        eoq_resp = _eoq(request)
        order_quantity = eoq_resp.policy["order_quantity"]
    else:
        order_quantity = values["demand_rate"] * values["lead_time"]

    policy = {
        "order_quantity": round(order_quantity, 2),
        "reorder_point": round(reorder_point, 2),
        "safety_stock": round(z * sigma_lt, 2),
    }
    return InventoryPolicyResponse(policy=policy, notes="Continuous review (Q,R) policy with normal demand assumption.")


def _newsvendor(request: InventoryPolicyRequest) -> InventoryPolicyResponse:
    values = _require(
        {
            "demand_rate": request.demand_rate,
            "demand_std": request.demand_std,
        },
        "newsvendor",
    )
    if request.underage_cost is not None and request.overage_cost is not None:
        critical_ratio = request.underage_cost / (request.underage_cost + request.overage_cost)
    else:
        critical_ratio = float(request.service_level or 0.95)

    z = norm.ppf(critical_ratio)
    order_up_to = values["demand_rate"] + z * values["demand_std"]
    policy = {
        "critical_ratio": round(critical_ratio, 3),
        "order_up_to_level": round(order_up_to, 2),
    }
    return InventoryPolicyResponse(policy=policy, notes="Single-period newsvendor solution with normal demand.")


def compute_policy(request: InventoryPolicyRequest) -> InventoryPolicyResponse:
    if request.method is InventoryMethod.EOQ:
        return _eoq(request)
    if request.method is InventoryMethod.QR:
        return _qr(request)
    if request.method is InventoryMethod.NEWSVENDOR:
        return _newsvendor(request)
    msg = f"Unsupported inventory method: {request.method}"
    raise ValueError(msg)


__all__ = ["compute_policy"]