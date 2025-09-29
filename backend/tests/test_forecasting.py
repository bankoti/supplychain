from __future__ import annotations

import math

from backend.data.models import ForecastMethod
from backend.engines.forecasting import run_forecast


def test_naive_forecast_returns_horizon(sample_series) -> None:
    response = run_forecast(ForecastMethod.NAIVE, sample_series, horizon=3)
    assert len(response.forecast) == 3
    assert response.metrics.mape >= 0


def test_ets_forecast_produces_metrics(sample_series) -> None:
    response = run_forecast(ForecastMethod.ETS, sample_series, horizon=4)
    assert len(response.forecast) == 4
    assert response.metrics.mase >= 0
    assert not math.isnan(response.metrics.bias)