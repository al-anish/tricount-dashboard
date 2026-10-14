"""Read-only endpoint for the expense list, with optional filters.

Filtering happens here (not in the service) so `TricountService` stays
focused purely on talking to `tricount-api`. Pagination is intentionally
left to the frontend's table component — the dataset for a personal
Tricount is small, and the frontend already needs client-side sorting.
"""
from datetime import date
import hmac
import os
from typing import Optional

from fastapi import APIRouter, Query, HTTPException, Response, Header, Depends

from app.models import ExpenseListOut, ExpenseOut, ExpenseCreateIn, ExpenseUpdateIn
from app.services.tricount_service import get_tricount_service

router = APIRouter(prefix="/api", tags=["expenses"])


def require_mutation_key(x_mutation_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("TRICOUNT_MUTATION_KEY", "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="Expense mutations are disabled until TRICOUNT_MUTATION_KEY is configured.")
    if not x_mutation_key or not hmac.compare_digest(x_mutation_key, expected):
        raise HTTPException(status_code=401, detail="A valid mutation key is required.")



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


@router.post("/expenses", response_model=ExpenseOut, status_code=201)
def create_expense(payload: ExpenseCreateIn, _auth: None = Depends(require_mutation_key)) -> ExpenseOut:
    try:
        return ExpenseOut(**get_tricount_service().create_expense(payload.model_dump(mode="json")))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.put("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: int, payload: ExpenseUpdateIn, _auth: None = Depends(require_mutation_key)) -> ExpenseOut:
    if expense_id <= 0:
        raise HTTPException(status_code=422, detail="Invalid expense ID.")
    if not payload.model_dump(exclude_unset=True):
        raise HTTPException(status_code=422, detail="Provide at least one field to update.")
    try:
        return ExpenseOut(**get_tricount_service().update_expense(expense_id, payload.model_dump(exclude_unset=True, mode="json")))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: int, _auth: None = Depends(require_mutation_key)) -> Response:
    if expense_id <= 0:
        raise HTTPException(status_code=422, detail="Invalid expense ID.")
    try:
        get_tricount_service().delete_expense(expense_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return Response(status_code=204)
