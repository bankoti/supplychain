from __future__ import annotations

from dataclasses import dataclass
from typing import List

import random
import simpy


@dataclass
class StockoutEvent:
    time: float
    shortfall: float


@dataclass
class SimulationReport:
    demand_served: float
    demand_lost: float
    stockouts: List[StockoutEvent]


def run_single_item_simulation(
    demand_profile: List[float],
    initial_inventory: float,
    reorder_point: float,
    order_quantity: float,
    lead_time: int,
    seed: int | None = None,
) -> SimulationReport:
    """Simulate a single-item inventory system with periodic demand."""

    random.seed(seed)
    env = simpy.Environment()

    inventory = {"on_hand": initial_inventory, "on_order": 0.0}
    stockouts: List[StockoutEvent] = []
    demand_served = 0.0
    demand_lost = 0.0

    def place_order(quantity: float) -> None:
        inventory["on_order"] += quantity

        def receive_order() -> None:
            inventory["on_order"] -= quantity
            inventory["on_hand"] += quantity

        env.process(_delayed_arrival(receive_order, lead_time))

    def _delayed_arrival(callback, delay: int):  # type: ignore[no-untyped-def]
        yield env.timeout(delay)
        callback()

    def demand_process():  # type: ignore[no-untyped-def]
        nonlocal demand_served, demand_lost
        for period, demand in enumerate(demand_profile, start=1):
            yield env.timeout(1)
            available = inventory["on_hand"]
            if available >= demand:
                inventory["on_hand"] -= demand
                demand_served += demand
            else:
                demand_served += available
                shortfall = demand - available
                demand_lost += shortfall
                inventory["on_hand"] = 0.0
                stockouts.append(StockoutEvent(time=period, shortfall=shortfall))

            projected = inventory["on_hand"] + inventory["on_order"]
            if projected <= reorder_point:
                place_order(order_quantity)

    env.process(demand_process())
    env.run()

    return SimulationReport(
        demand_served=demand_served,
        demand_lost=demand_lost,
        stockouts=stockouts,
    )


__all__ = [
    "SimulationReport",
    "StockoutEvent",
    "run_single_item_simulation",
]