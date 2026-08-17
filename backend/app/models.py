"""Pydantic schemas for API responses.

These define the normalized shape returned to the frontend, independent of
whatever internal shape the `tricount-api` package happens to use. Only
`app/services/tricount_service.py` needs to know about the raw package.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel


class MemberOut(BaseModel):
    id: Optional[int] = None
    uuid: str
    name: str
    status: str


class TricountOut(BaseModel):
    title: str
    description: str
    currency: str
    members: list[MemberOut]


class ExpenseOut(BaseModel):
    id: Optional[int] = None
    uuid: str
    description: str
    amount: float
    currency: str
    payer: str
    date: str
    type: str
    category: Optional[str] = None


class ExpenseListOut(BaseModel):
    items: list[ExpenseOut]
    total: int


class HighestExpenseOut(BaseModel):
    description: str
    amount: float


class CategorySpendingOut(BaseModel):
    category: str
    amount: float
    count: int


class DailySpendingOut(BaseModel):
    date: str
    amount: float


class MemberSpendingOut(BaseModel):
    member: str
    amount: float


class DashboardOut(BaseModel):
    total_expenses: float
    expense_count: int
    average_daily: float
    highest_expense: Optional[HighestExpenseOut] = None
    categories: list[CategorySpendingOut]
    daily_spending: list[DailySpendingOut]
    member_spending: list[MemberSpendingOut]


class BalanceOut(BaseModel):
    member: str
    uuid: str
    amount: float
    status: Literal["owed", "owes", "settled"]


class BalancesOut(BaseModel):
    currency: str
    balances: list[BalanceOut]
