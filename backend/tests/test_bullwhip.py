from __future__ import annotations

from backend.engines.bullwhip import compute_bullwhip_index


def test_bullwhip_amplification_calculated() -> None:
    demand = [100, 110, 120, 115, 130]
    orders = [105, 120, 135, 125, 140]
    response = compute_bullwhip_index(demand, orders)
    assert response.amplification_index > 1