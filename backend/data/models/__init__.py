from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, ValidationInfo, field_validator, model_validator


class ForecastMethod(str, Enum):
    NAIVE = "naive"
    ETS = "ets"
    CROSTON = "croston"


class ForecastMetrics(BaseModel):
    mape: float = Field(..., description="Mean absolute percentage error.")
    mase: float = Field(..., description="Mean absolute scaled error.")
    bias: float = Field(..., description="Average forecast bias (forecast - actual).")


class ForecastRequest(BaseModel):
    method: ForecastMethod
    series: List[float] = Field(..., min_length=2)
    horizon: int = Field(4, gt=0, le=52)

    @field_validator("series")
    @classmethod
    def validate_series(cls, value: List[float]) -> List[float]:
        if any(point is None for point in value):
            msg = "Series must not contain null values."
            raise ValueError(msg)
        if len(value) < 2:
            msg = "Series must contain at least two observations."
            raise ValueError(msg)
        return value

    @model_validator(mode="after")
    def check_horizon(self) -> "ForecastRequest":
        if self.horizon >= len(self.series):
            msg = "Horizon must be smaller than the historical series length."
            raise ValueError(msg)
        return self


class ForecastResponse(BaseModel):
    forecast: List[float]
    metrics: ForecastMetrics
    model_summary: Dict[str, float] = Field(default_factory=dict)


class InventoryMethod(str, Enum):
    EOQ = "eoq"
    QR = "qr"
    NEWSVENDOR = "newsvendor"


class InventoryPolicyRequest(BaseModel):
    method: InventoryMethod
    annual_demand: Optional[float] = None
    demand_rate: Optional[float] = None
    lead_time: Optional[float] = None
    holding_cost: Optional[float] = None
    ordering_cost: Optional[float] = None
    service_level: Optional[float] = Field(default=0.95, ge=0.5, le=0.999)
    demand_std: Optional[float] = None
    underage_cost: Optional[float] = None
    overage_cost: Optional[float] = None


class InventoryPolicyResponse(BaseModel):
    policy: Dict[str, float]
    notes: str = ""


class BullwhipDiagnosticsRequest(BaseModel):
    demand: List[float] = Field(..., min_length=2)
    orders: List[float] = Field(..., min_length=2)

    @field_validator("orders")
    @classmethod
    def validate_lengths(cls, value: List[float], info: ValidationInfo) -> List[float]:
        demand = info.data.get("demand", [])
        if demand and len(value) != len(demand):
            msg = "Orders and demand must have the same length."
            raise ValueError(msg)
        return value


class BullwhipDiagnosticsResponse(BaseModel):
    amplification_index: float
    demand_variance: float
    order_variance: float


class KPIResponse(BaseModel):
    customer_service_level: float
    fill_rate: float
    inventory_turns: float
    holding_cost: float
