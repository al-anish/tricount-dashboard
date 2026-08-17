"""The ONLY module in this backend that imports/calls the `tricount-api`
package.

`tricount-api` is unofficial and reverse-engineered, so every call into it is
isolated here and wrapped defensively. If a future version of the package
renames a method or field, this is the one file that needs updating — routers
and the frontend only ever see the normalized `dict`/Pydantic shapes this
class returns.

Read-only note: this service never calls any of the package's write methods
(create_transaction, edit_transaction, delete_transaction, add_members,
create_reimbursement, etc.). `join_tricount()` is used, per the package's own
"Quick Start" as the way to fetch a tricount's data from just its sharing
token — it does not modify any expense data. It does link this app's device
identity to the tricount's first member on Tricount's side (that's inherent
to how the unofficial API works), but that's a metadata/identity detail, not
a write to your expenses or balances.

No caching: every call below re-fetches straight from Tricount, so results
are always current. That's simpler and safer than maintaining a cache to
invalidate, and the API server's own "Refresh" button in the browser just
re-triggers these same calls.
"""
from __future__ import annotations

import logging
from datetime import datetime
from functools import lru_cache
import time
from threading import Lock
from typing import Optional

from tricount import load_client

from app.config import get_settings

logger = logging.getLogger("tricount_service")

# Only NORMAL transactions represent an actual expense. INCOME (refunds, etc.)
# and BALANCE (reimbursements between members) are intentionally excluded
# from this read-only *expense* tracker — reimbursements in particular are
# explicitly out of scope for this app.
EXPENSE_TRANSACTION_TYPE = "NORMAL"


class TricountServiceError(Exception):
    """Raised whenever the tricount-api client fails.

    Routers turn this into a clean HTTP error with no stack trace and no
    credentials — see the exception handler registered in app/main.py.
    """


class TricountService:
    """Thin, read-only wrapper around the `tricount-api` client."""

    def __init__(self) -> None:
        self._client = None
        self._fetch_lock = Lock()
        self._tricount_cache = None
        self._tricount_cache_time = 0.0
        self._cache_ttl = 5
    # -- internal helpers ----------------------------------------------
    def _get_client(self):
        if self._client is None:
            try:
                self._client = load_client()
            except Exception as exc:  # pragma: no cover - defensive
                logger.error("Failed to initialize the tricount-api client: %s", type(exc).__name__)
                raise TricountServiceError("Could not initialize the Tricount client.") from exc
        return self._client

    def _fetch_tricount(self):
        """Fetch the Tricount, reusing a very short-lived in-memory snapshot."""

        settings = get_settings()

        with self._fetch_lock:
            now = time.monotonic()

            if (
                self._tricount_cache is not None
                and now - self._tricount_cache_time < self._cache_ttl
            ):
                return self._tricount_cache

            client = self._get_client()

            try:
                tricount = client.join_tricount(
                    settings.tricount_token,
                    fetch_full=True,
                )

                self._tricount_cache = tricount
                self._tricount_cache_time = now

                return tricount

            except Exception:
                logger.exception("Failed to fetch Tricount")
                raise TricountServiceError(
                    "Could not fetch the Tricount. Check that TRICOUNT_TOKEN "
                    "in backend/.env is a valid, current sharing token."
                )

    @staticmethod
    def _member_name_by_uuid(tricount, member_uuid: Optional[str]) -> str:
        if member_uuid:
            for member in tricount.members:
                if getattr(member, "uuid", None) == member_uuid:
                    return member.display_name
        return "Unknown"

    @staticmethod
    def _normalize_date(raw_date: Optional[str]) -> str:
        """Normalize whatever date string tricount-api returns to YYYY-MM-DD."""
        if not raw_date:
            return ""
        cleaned = raw_date.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(cleaned).date().isoformat()
        except ValueError:
            # Defensive fallback if the format ever differs from ISO 8601.
            return raw_date[:10]

    @staticmethod
    def _transaction_type_value(tx) -> str:
        # `transaction_type` is documented as a TransactionType enum, but we
        # don't assume that shape — fall back to a plain string either way.
        return getattr(tx.transaction_type, "value", None) or str(tx.transaction_type)

    @classmethod
    def _normalize_transaction(cls, tricount, tx) -> dict:
        category = getattr(tx, "category_custom", None) or getattr(tx, "category", None)
        return {
            "id": tx.id,
            "uuid": tx.uuid,
            "description": tx.description,
            "amount": round(tx.amount.as_abs, 2),
            "currency": tx.amount.currency or tricount.currency,
            "payer": cls._member_name_by_uuid(tricount, tx.membership_uuid_owner),
            "date": cls._normalize_date(tx.date),
            "type": cls._transaction_type_value(tx),
            "category": category,
        }

    # -- public read-only API -------------------------------------------
    def get_tricount_info(self) -> dict:
        tricount = self._fetch_tricount()
        members = [
            {"id": m.id, "uuid": m.uuid, "name": m.display_name, "status": m.status}
            for m in tricount.members
        ]
        return {
            "title": tricount.title,
            "description": tricount.description or "",
            "currency": tricount.currency,
            "members": members,
        }

    def get_expenses(self) -> list[dict]:
        """Return only NORMAL-type transactions (real expenses), newest first."""
        tricount = self._fetch_tricount()
        expenses = [
            self._normalize_transaction(tricount, tx)
            for tx in tricount.transactions
            if self._transaction_type_value(tx) == EXPENSE_TRANSACTION_TYPE
        ]
        expenses.sort(key=lambda e: e["date"], reverse=True)
        return expenses

    def get_balances(self) -> dict:
        tricount = self._fetch_tricount()
        client = self._get_client()
        try:
            raw_balances = client.get_balances(tricount)
        except Exception as exc:
            logger.error("Failed to calculate balances: %s", type(exc).__name__)
            raise TricountServiceError("Could not calculate balances.") from exc

        uuid_by_name = {m.display_name: m.uuid for m in tricount.members}
        balances = []
        for name, amount in raw_balances.items():
            amount = round(amount, 2)
            if amount > 0:
                status = "owed"
            elif amount < 0:
                status = "owes"
            else:
                status = "settled"
            balances.append(
                {"member": name, "uuid": uuid_by_name.get(name, ""), "amount": amount, "status": status}
            )
        return {"currency": tricount.currency, "balances": balances}


@lru_cache
def get_tricount_service() -> TricountService:
    return TricountService()
