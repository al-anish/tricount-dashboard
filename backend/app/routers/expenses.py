"""Read-only endpoint for the expense list, with optional filters.

Filtering happens here (not in the service) so `TricountService` stays
focused purely on talking to `tricount-api`. Pagination is intentionally
left to the frontend's table component — the dataset for a personal
Tricount is small, and the frontend already needs client-side sorting.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Query

from app.models import ExpenseListOut, ExpenseOut
from app.services.tricount_service import get_tricount_service

router = APIRouter(prefix="/api", tags=["expenses"])


@router.get("/expenses", response_model=ExpenseListOut)
def get_expenses(
    search: Optional[str] = Query(None, description="Case-insensitive text search over the description"),
    category: Optional[str] = Query(None, description="Filter by exact category"),
    member: Optional[str] = Query(None, description="Filter by payer name"),
    start_date: Optional[date] = Query(None, description="Only expenses on/after this date"),
    end_date: Optional[date] = Query(None, description="Only expenses on/before this date"),
) -> ExpenseListOut:
    service = get_tricount_service()
    expenses = service.get_expenses()

    if search:
        needle = search.lower()
        expenses = [e for e in expenses if needle in e["description"].lower()]
    if category:
        expenses = [e for e in expenses if e["category"] == category]
    if member:
        expenses = [e for e in expenses if e["payer"] == member]
    if start_date:
        start_str = start_date.isoformat()
        expenses = [e for e in expenses if e["date"] and e["date"] >= start_str]
    if end_date:
        end_str = end_date.isoformat()
        expenses = [e for e in expenses if e["date"] and e["date"] <= end_str]

    return ExpenseListOut(items=[ExpenseOut(**e) for e in expenses], total=len(expenses))
