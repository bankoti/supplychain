from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable

import pulp  # type: ignore[import-untyped]


@dataclass
class OptimizationResult:
    objective: float
    production_plan: Dict[str, float]
    shadow_prices: Dict[str, float]


@dataclass
class CapacityConstraint:
    name: str
    limit: float


@dataclass
class Product:
    name: str
    contribution_margin: float
    capacity_usage: Dict[str, float]


def solve_make_to_order(
    products: Iterable[Product],
    capacities: Iterable[CapacityConstraint],
) -> OptimizationResult:
    """Solve a simple make-to-order allocation problem.

    Maximize total contribution margin subject to resource capacities.
    """

    model = pulp.LpProblem("make_to_order", pulp.LpMaximize)
    decision_vars: Dict[str, pulp.LpVariable] = {}

    for product in products:
        decision_vars[product.name] = pulp.LpVariable(
            f"build_{product.name}", lowBound=0
        )

    model += pulp.lpSum(
        decision_vars[p.name] * p.contribution_margin for p in products
    )

    for capacity in capacities:
        model += (
            pulp.lpSum(
                decision_vars[product.name]
                * product.capacity_usage.get(capacity.name, 0.0)
                for product in products
            )
            <= capacity.limit,
            capacity.name,
        )

    model.solve(pulp.PULP_CBC_CMD(msg=False))

    plan = {
        name: float(var.value() or 0.0) for name, var in decision_vars.items()
    }
    duals: Dict[str, float] = {}
    for name, constraint in model.constraints.items():
        duals[name] = float(constraint.pi)

    return OptimizationResult(
        objective=float(pulp.value(model.objective) or 0.0),
        production_plan=plan,
        shadow_prices=duals,
    )


__all__ = [
    "CapacityConstraint",
    "OptimizationResult",
    "Product",
    "solve_make_to_order",
]
