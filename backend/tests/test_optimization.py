from __future__ import annotations

from backend.engines.optimization import (
    CapacityConstraint,
    Product,
    solve_make_to_order,
)


def test_make_to_order_solution() -> None:
    products = [
        Product(
            name="A",
            contribution_margin=50,
            capacity_usage={"machine": 2, "labor": 1},
        ),
        Product(
            name="B",
            contribution_margin=40,
            capacity_usage={"machine": 1, "labor": 1.5},
        ),
    ]
    capacities = [
        CapacityConstraint(name="machine", limit=100),
        CapacityConstraint(name="labor", limit=80),
    ]

    result = solve_make_to_order(products, capacities)

    assert result.objective > 0
    assert result.production_plan["A"] >= 0
    assert result.production_plan["B"] >= 0
    assert "machine" in result.shadow_prices