from __future__ import annotations

from fastapi import APIRouter

from backend.data.models import (
    BullwhipDiagnosticsRequest,
    BullwhipDiagnosticsResponse,
)
from backend.engines.bullwhip import compute_bullwhip_index

router = APIRouter()


@router.post("/diagnostics", response_model=BullwhipDiagnosticsResponse)
def bullwhip_diagnostics(payload: BullwhipDiagnosticsRequest) -> BullwhipDiagnosticsResponse:
    return compute_bullwhip_index(payload.demand, payload.orders)