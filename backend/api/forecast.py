from __future__ import annotations

from fastapi import APIRouter

from backend.data.models import ForecastRequest, ForecastResponse
from backend.engines.forecasting import run_forecast

router = APIRouter()


@router.post("/run", response_model=ForecastResponse)
def run_forecast_endpoint(payload: ForecastRequest) -> ForecastResponse:
    return run_forecast(payload.method, payload.series, payload.horizon)