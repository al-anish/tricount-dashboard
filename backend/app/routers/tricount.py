"""Read-only endpoint for Tricount metadata + members."""
from fastapi import APIRouter

from app.models import TricountOut
from app.services.tricount_service import get_tricount_service

router = APIRouter(prefix="/api", tags=["tricount"])


@router.get("/tricount", response_model=TricountOut)
def get_tricount() -> TricountOut:
    service = get_tricount_service()
    return TricountOut(**service.get_tricount_info())
