# Tricount Expense Dashboard (read-only)

A small full-stack app that reads your real Tricount data — via the
unofficial `tricount-api` Python package — and turns it into a personal
expense dashboard. **Read-only.** No write endpoints exist anywhere in this
codebase.

```
Tricount → tricount-api → FastAPI (Python) → React + Ant Design → Dashboard
```

## ⚠️ Please read before running

This project was built in a sandboxed environment **with no internet
access**, so I was not able to `pip install tricount-api`, `npm install`, or
actually run either server against a real Tricount. Everything here is
written and reviewed carefully, and `TricountService` is built against the
**real, documented API of `tricount-api` 0.1.2** (I looked up its PyPI page
and README rather than relying on memory, since it's an unofficial,
reverse-engineered package that can change without notice). Still:

- Run `pip install -r requirements.txt` and do a quick sanity check (e.g.
  `python -c "from tricount import load_client; c = load_client(); t =
  c.join_tricount('YOUR_TOKEN'); print(t.title, len(t.transactions))"`)
  before trusting the full app.
- If a newer `tricount-api` release has changed method names, dataclass
  fields, or the `TransactionType`/`Category` values, the **only** file you
  should need to touch is `backend/app/services/tricount_service.py` — it's
  intentionally the sole place that imports `tricount`.
- I could not run `tsc` or a real build either, so please run `npm install`
  and `npm run dev` and watch the terminal/browser console the first time.

## Design decisions worth knowing about

The brief left a few things unspecified. Here's what I chose, and why:

- **Only `NORMAL` transactions count as "expenses."** `tricount-api` also
  returns `INCOME` (refunds, etc.) and `BALANCE` (reimbursements between
  members) transactions. Since reimbursements are explicitly out of scope
  and this is meant to be an *expense* tracker, `/api/expenses` and all
  `/api/dashboard` numbers only include `NORMAL` transactions.
- **"Member spending" = amount each member paid (fronted)**, not their
  allocated share of each expense. Each member's net position (what they
  actually owe/are owed) is already covered by `/api/balances`.
- **"Average daily spending" = total spending ÷ number of days between the
  first and last recorded expense** (inclusive), not divided by calendar
  days since today.
- **No server-side caching.** Every request re-fetches straight from
  Tricount, so the numbers are always current and the frontend's "Refresh"
  button just re-runs the same fetches — simpler than a cache with
  invalidation logic, and fine for personal, occasional use.
- **Two small extra frontend files** beyond the ones listed in the spec:
  `components/MemberSpendingChart.tsx` and `components/RecentExpenses.tsx`,
  since "Member spending chart" and "Recent expenses" are both explicitly
  required features but weren't in the component file list. Also added
  `constants.ts` and `utils/format.ts` for shared category labels and
  currency/date formatting.
- `tricount_credentials.json` — a file `tricount-api` auto-creates on first
  run to remember this app's device identity — is git-ignored next to
  `.env`, since it's effectively a credential too.

## Local setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env         # then fill in TRICOUNT_TOKEN
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env         # defaults to http://localhost:8000, adjust if needed
npm run dev
```

Dashboard: http://localhost:5173

## Project structure

```
backend/
  app/
    main.py                    # FastAPI app, CORS, error handling, health check
    config.py                  # Loads TRICOUNT_TOKEN / CORS_ORIGINS from .env
    models.py                  # Pydantic response schemas
    services/
      tricount_service.py      # The ONLY file that imports tricount-api
    routers/
      tricount.py               # GET /api/tricount
      expenses.py                # GET /api/expenses
      dashboard.py                # GET /api/dashboard
      balances.py                  # GET /api/balances
  requirements.txt
  .env.example
  .gitignore

frontend/
  src/
    api/            # Axios calls: client.ts, tricount.ts, expenses.ts, dashboard.ts, balances.ts
    components/      # SummaryCards, SpendingChart, CategoryChart, MemberSpendingChart,
                      # RecentExpenses, ExpenseTable, BalanceCard
    types.ts          # Shared TS types mirroring the backend's Pydantic schemas
    constants.ts        # Category labels/emoji, chart colors
    utils/format.ts      # Currency + date formatting
    App.tsx                # The single dashboard page
    main.tsx
  package.json
  .env.example
  .gitignore
```

## Endpoints

| Method | Path            | Returns                                             |
| ------ | --------------- | ---------------------------------------------------- |
| GET    | `/health`       | `{ "status": "ok" }`                                  |
| GET    | `/api/tricount` | Title, description, currency, members                |
| GET    | `/api/expenses` | Filtered expense list (`search`, `category`, `member`, `start_date`, `end_date`) |
| GET    | `/api/dashboard`| Totals, highest expense, category/daily/member breakdowns |
| GET    | `/api/balances` | Per-member balance (owed / owes / settled)            |

No write endpoints exist. `allow_methods` in CORS is locked to `GET`.
