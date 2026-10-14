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


from datetime import date as Date
from pydantic import Field, field_validator


class ExpenseCreateIn(BaseModel):
    description: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0, allow_inf_nan=False)
    date: Date
    category: str
    payer_uuid: str = Field(min_length=1)
    split_member_uuids: list[str] = Field(min_length=1)

    @field_validator("description")
    @classmethod
    def description_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Description is required.")
        return value.strip()


class ExpenseUpdateIn(BaseModel):
    description: str | None = Field(default=None, min_length=1, max_length=200)
    amount: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    date: Date | None = None
    category: str | None = None

    @field_validator("description")
    @classmethod
    def description_not_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Description is required.")
        return value.strip() if value is not None else value
