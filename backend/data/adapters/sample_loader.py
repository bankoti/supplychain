from __future__ import annotations

from pathlib import Path
from typing import List

import pandas as pd


_BASE_PATH = Path(__file__).resolve().parent.parent
_SAMPLE_PATH = _BASE_PATH / "sample_data"


def _resolve(name: str) -> Path:
    path = _SAMPLE_PATH / name
    if not path.exists():
        msg = f"Sample data file not found: {name}"
        raise FileNotFoundError(msg)
    return path


def load_table(name: str) -> pd.DataFrame:
    """Load a CSV file from the sample data directory."""
    return pd.read_csv(_resolve(name))


def load_demand_series(product_id: str, location_id: str) -> List[float]:
    demand = load_table("demand.csv")
    filtered = demand[
        (demand["product_id"] == product_id)
        & (demand["location_id"] == location_id)
    ]
    series = filtered.sort_values("date")["quantity"].tolist()
    if not series:
        msg = f"No demand series for product={product_id} location={location_id}"
        raise ValueError(msg)
    return series


__all__ = [
    "load_table",
    "load_demand_series",
]