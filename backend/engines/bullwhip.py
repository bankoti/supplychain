from __future__ import annotations

import numpy as np

from backend.data.models import BullwhipDiagnosticsResponse


def compute_bullwhip_index(demand, orders) -> BullwhipDiagnosticsResponse:
    demand_arr = np.asarray(demand, dtype=float)
    orders_arr = np.asarray(orders, dtype=float)
    if demand_arr.size < 2 or orders_arr.size < 2:
        msg = "Demand and orders must each contain at least two observations."
        raise ValueError(msg)

    demand_var = float(np.var(demand_arr, ddof=1))
    order_var = float(np.var(orders_arr, ddof=1))
    amplification = order_var / demand_var if demand_var else float("inf")
    return BullwhipDiagnosticsResponse(
        amplification_index=amplification,
        demand_variance=demand_var,
        order_variance=order_var,
    )


__all__ = ["compute_bullwhip_index"]