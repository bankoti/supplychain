from __future__ import annotations

from fastapi import FastAPI

from backend.api import forecast, inventory, bullwhip, kpi

app = FastAPI(title="SupplyChainOS API", version="0.1.0")

app.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
app.include_router(bullwhip.router, prefix="/bullwhip", tags=["bullwhip"])
app.include_router(kpi.router, prefix="/kpi", tags=["kpi"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}