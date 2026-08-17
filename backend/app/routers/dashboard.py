"""Read-only endpoint that aggregates real expense data for the dashboard.

Design notes (documented here since the source spec left these ambiguous):
- "average_daily" = total spending / number of days spanned between the
  first and last recorded expense (inclusive), not calendar days since
  today. This reflects the actual pace of spending in the Tricount.
- "member_spending" = total amount each member has *paid* (fronted), not
  their allocated share of each expense. Each member's net position is
  already covered separately by /api/balances.
"""
from collections import defaultdict
from datetime import date as date_cls

from fastapi import APIRouter

from app.models import (
    CategorySpendingOut,
    DailySpendingOut,
    DashboardOut,
    HighestExpenseOut,
    MemberSpendingOut,
)
from app.services.tricount_service import get_tricount_service

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardOut)
def get_dashboard() -> DashboardOut:
    service = get_tricount_service()
    expenses = service.get_expenses()

    if not expenses:
        return DashboardOut(
            total_expenses=0,
            expense_count=0,
            average_daily=0,
            highest_expense=None,
            categories=[],
            daily_spending=[],
            member_spending=[],
        )

    total_expenses = round(sum(e["amount"] for e in expenses), 2)
    expense_count = len(expenses)

    dated_expenses = [e for e in expenses if e["date"]]
    if dated_expenses:
        dates = sorted({e["date"] for e in dated_expenses})
        span_days = (date_cls.fromisoformat(dates[-1]) - date_cls.fromisoformat(dates[0])).days + 1
    else:
        span_days = 1
    average_daily = round(total_expenses / span_days, 2) if span_days else 0.0

    highest = max(expenses, key=lambda e: e["amount"])
    highest_expense = HighestExpenseOut(description=highest["description"], amount=highest["amount"])

    category_totals: dict[str, dict] = defaultdict(lambda: {"amount": 0.0, "count": 0})
    for e in expenses:
        key = e["category"] or "OTHER"
        category_totals[key]["amount"] += e["amount"]
        category_totals[key]["count"] += 1
    categories = [
        CategorySpendingOut(category=cat, amount=round(v["amount"], 2), count=v["count"])
        for cat, v in sorted(category_totals.items(), key=lambda kv: kv[1]["amount"], reverse=True)
    ]

    daily_totals: dict[str, float] = defaultdict(float)
    for e in dated_expenses:
        daily_totals[e["date"]] += e["amount"]
    daily_spending = [
        DailySpendingOut(date=d, amount=round(amt, 2)) for d, amt in sorted(daily_totals.items())
    ]

    member_totals: dict[str, float] = defaultdict(float)
    for e in expenses:
        member_totals[e["payer"]] += e["amount"]
    member_spending = [
        MemberSpendingOut(member=m, amount=round(amt, 2))
        for m, amt in sorted(member_totals.items(), key=lambda kv: kv[1], reverse=True)
    ]

    return DashboardOut(
        total_expenses=total_expenses,
        expense_count=expense_count,
        average_daily=average_daily,
        highest_expense=highest_expense,
        categories=categories,
        daily_spending=daily_spending,
        member_spending=member_spending,
    )
