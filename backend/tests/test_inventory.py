from __future__ import annotations

from backend.data.models import InventoryMethod, InventoryPolicyRequest
from backend.engines.inventory import compute_policy


def test_eoq_policy_calculates_quantity() -> None:
    request = InventoryPolicyRequest(
        method=InventoryMethod.EOQ,
        annual_demand=12000,
        ordering_cost=150,
        holding_cost=3,
    )
    response = compute_policy(request)
    assert response.policy["order_quantity"] > 0


def test_qr_policy_returns_reorder_point() -> None:
    request = InventoryPolicyRequest(
        method=InventoryMethod.QR,
        demand_rate=400,
        lead_time=2,
        demand_std=30,
        service_level=0.95,
        annual_demand=12000,
        ordering_cost=150,
        holding_cost=3,
    )
    response = compute_policy(request)
    assert response.policy["reorder_point"] > response.policy["order_quantity"] / 2


def test_newsvendor_returns_level() -> None:
    request = InventoryPolicyRequest(
        method=InventoryMethod.NEWSVENDOR,
        demand_rate=500,
        demand_std=80,
        underage_cost=10,
        overage_cost=2,
    )
    response = compute_policy(request)
    assert 0 < response.policy["critical_ratio"] < 1