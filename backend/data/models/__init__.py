from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, ValidationInfo, field_validator, model_validator


class ForecastMethod(str, Enum):
    NAIVE = "naive"
    ETS = "ets"
    CROSTON = "croston"
    ARIMA = "arima"


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


class InventorySimulationRequest(BaseModel):
    demand_profile: List[float] = Field(..., min_length=1)
    initial_inventory: float = Field(..., ge=0)
    reorder_point: float
    order_quantity: float = Field(..., gt=0)
    lead_time: int = Field(..., ge=0)
    seed: Optional[int] = None


class StockoutEventModel(BaseModel):
    time: float
    shortfall: float


class InventorySimulationResponse(BaseModel):
    demand_served: float
    demand_lost: float
    stockouts: List[StockoutEventModel]


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
class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskModel(BaseModel):
    id: str
    title: str = Field(..., min_length=1)
    status: TaskStatus = TaskStatus.TODO
    description: Optional[str] = None


class PlanModel(BaseModel):
    id: str
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    tasks: List[TaskModel] = Field(default_factory=list)

    @property
    def progress(self) -> float:
        total = len(self.tasks)
        if total == 0:
            return 0.0
        completed = sum(1 for task in self.tasks if task.status is TaskStatus.DONE)
        return completed / total


class PlanCreateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    tasks: List[TaskModel] = Field(default_factory=list)


class PlanUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = None
    tasks: Optional[List[TaskModel]] = None
