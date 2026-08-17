"""Read-only endpoint for current member balances.

Positive = owed money. Negative = owes money. Zero = settled.
"""
from fastapi import APIRouter

from app.models import BalancesOut
from app.services.tricount_service import get_tricount_service

router = APIRouter(prefix="/api", tags=["balances"])


@router.get("/balances", response_model=BalancesOut)
def get_balances() -> BalancesOut:
    service = get_tricount_service()
    return BalancesOut(**service.get_balances())
