from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api import forecast, inventory, bullwhip, kpi, plans

app = FastAPI(title="SupplyChainOS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
app.include_router(bullwhip.router, prefix="/bullwhip", tags=["bullwhip"])
app.include_router(kpi.router, prefix="/kpi", tags=["kpi"])
app.include_router(plans.router, prefix="/plans", tags=["plans"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}