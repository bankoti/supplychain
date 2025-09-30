from __future__ import annotations

from typing import Dict, List, Sequence, Tuple

import numpy as np
from statsmodels.tsa.arima.model import ARIMA  # type: ignore[import-untyped]
from statsmodels.tsa.holtwinters import ExponentialSmoothing, SimpleExpSmoothing  # type: ignore[import-untyped]

from backend.data.models import ForecastMethod, ForecastMetrics, ForecastResponse


def _train_test(series: Sequence[float], horizon: int) -> Tuple[np.ndarray, np.ndarray]:
    data = np.asarray(series, dtype=float)
    if data.size <= horizon:
        msg = "Historical series must be longer than the forecast horizon."
        raise ValueError(msg)
    train = data[:-horizon]
    test = data[-horizon:]
    return train, test


def _naive_forecast(train: np.ndarray, horizon: int) -> Tuple[List[float], Dict[str, float]]:
    last_value = float(train[-1])
    return [last_value for _ in range(horizon)], {"alpha": 1.0}


def _ets_forecast(train: np.ndarray, horizon: int) -> Tuple[List[float], Dict[str, float]]:
    try:
        model = ExponentialSmoothing(train, trend=None, seasonal=None)
        fit = model.fit(optimized=True)
    except ValueError:
        model = SimpleExpSmoothing(train)
        fit = model.fit(optimized=True)
    forecast = fit.forecast(horizon)
    alpha = float(getattr(fit, "smoothing_level", 0.1) or 0.1)
    return forecast.tolist(), {"alpha": alpha}


def _croston_forecast(train: np.ndarray, horizon: int) -> Tuple[List[float], Dict[str, float]]:
    alpha = 0.1
    d_hat: float | None = None
    p_hat: float | None = None
    interval = 1.0

    for value in train:
        if value > 0:
            d_hat = value if d_hat is None else d_hat + alpha * (value - d_hat)
            p_hat = interval if p_hat is None else p_hat + alpha * (interval - p_hat)
            interval = 1.0
        else:
            interval += 1.0

    if d_hat is None or p_hat is None or p_hat == 0:
        forecast_value = 0.0
    else:
        forecast_value = d_hat / p_hat

    return [float(forecast_value)] * horizon, {"alpha": alpha}


def _arima_forecast(train: np.ndarray, horizon: int) -> Tuple[List[float], Dict[str, float]]:
    if train.size < 4:
        msg = "ARIMA requires at least four observations."
        raise ValueError(msg)
    model = ARIMA(train, order=(1, 1, 1))
    fit = model.fit()
    forecast = fit.forecast(horizon)

    summary = {
        "sigma2": float(getattr(fit, "sigma2", 0.0)),
        "ar1": float(fit.arparams[0]) if getattr(fit, "arparams", np.array([])).size else 0.0,
        "ma1": float(fit.maparams[0]) if getattr(fit, "maparams", np.array([])).size else 0.0,
    }
    return forecast.tolist(), summary


def _calculate_metrics(
    train: np.ndarray,
    actual: np.ndarray,
    forecast: Sequence[float],
) -> ForecastMetrics:
    forecast_arr = np.asarray(forecast, dtype=float)
    errors = forecast_arr - actual

    mask = actual != 0
    if mask.any():
        mape = float(np.mean(np.abs(errors[mask] / actual[mask])) * 100)
    else:
        mape = 0.0

    naive_diffs = np.abs(np.diff(train))
    denom = float(np.mean(naive_diffs)) if naive_diffs.size else 1.0
    if denom == 0:
        denom = 1.0
    mase = float(np.mean(np.abs(errors)) / denom)
    bias = float(np.mean(errors))
    return ForecastMetrics(mape=mape, mase=mase, bias=bias)


def run_forecast(method: ForecastMethod, series: Sequence[float], horizon: int) -> ForecastResponse:
    train, actual = _train_test(series, horizon)

    if method is ForecastMethod.NAIVE:
        forecast, summary = _naive_forecast(train, horizon)
    elif method is ForecastMethod.ETS:
        forecast, summary = _ets_forecast(train, horizon)
    elif method is ForecastMethod.CROSTON:
        forecast, summary = _croston_forecast(train, horizon)
    elif method is ForecastMethod.ARIMA:
        forecast, summary = _arima_forecast(train, horizon)
    else:
        msg = f"Unsupported forecast method: {method}"
        raise ValueError(msg)

    metrics = _calculate_metrics(train, actual, forecast)
    return ForecastResponse(forecast=list(forecast), metrics=metrics, model_summary=summary)


__all__ = ["run_forecast"]