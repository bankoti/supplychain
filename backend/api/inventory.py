from __future__ import annotations

from fastapi import APIRouter

from backend.data.models import InventoryPolicyRequest, InventoryPolicyResponse
from backend.engines.inventory import compute_policy

router = APIRouter()


@router.post("/policy", response_model=InventoryPolicyResponse)
def compute_inventory_policy(payload: InventoryPolicyRequest) -> InventoryPolicyResponse:
    return compute_policy(payload)