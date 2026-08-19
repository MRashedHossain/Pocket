# Pocket API

REST API for **Pocket** (a.k.a. *Ledger*), a personal/household expense tracker.
Derived from the UI/UX design in `references/design/` (`Ledger (formal).dc.html`,
`Ledger.dc.html`, `Pocket-export-src.dc.html`).

## Conventions

- Base path: `/api/v1`
- Format: JSON request/response bodies, `Content-Type: application/json`
- Auth: `Authorization: Bearer <token>` on every endpoint except `POST /auth/login`
- Dates: `YYYY-MM-DD` (ISO 8601, no time component)
- Month keys: `YYYY-MM`, used for filtering expenses/income/dashboard by month
- Money: integer, major currency unit (e.g. BDT Taka, no decimals — matches the
  design's `Math.round(n)` formatting). Currency symbol is a display-only user
  setting (`settings.currencySymbol`, default `৳`).
- IDs: opaque strings, server-generated
- Errors:

```json
{ "error": { "code": "validation_error", "message": "Enter an amount greater than zero." } }
```

- Standard status codes: `200` OK, `201` Created, `204` No Content, `400` validation,
  `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict.

---

## Auth

### `POST /auth/login`
Request:
```json
{ "email": "n.hasan@ledger.bd", "password": "•••••" }
```
Response `200`:
```json
{ "token": "<jwt>", "user": { "id": "u1", "name": "Nayeem Hasan", "email": "n.hasan@ledger.bd" } }
```
`400` if either field missing/invalid.

### `POST /auth/logout`
`204`. Invalidates the bearer token.

### `GET /me`
Returns the current user profile.
```json
{ "id": "u1", "name": "Nayeem Hasan", "email": "n.hasan@ledger.bd" }
```

### `PATCH /me`
Update `name` / `email`. Body: partial object, same shape as `GET /me`.

---

## Expense categories

Budget categories with an optional monthly ceiling.

`ExpenseCategory`
```json
{ "id": "c1", "name": "Groceries", "limit": 12000 }
```
`limit` — integer, `0` means "no ceiling".

| Method | Path | Description |
|---|---|---|
| GET | `/expense-categories` | List all |
| POST | `/expense-categories` | Create — body `{ "name": "Schooling", "limit": 5000 }` |
| PATCH | `/expense-categories/{id}` | Update `name` and/or `limit` |
| DELETE | `/expense-categories/{id}` | Delete |

## Income categories

`IncomeCategory`
```json
{ "id": "i1", "name": "Salary" }
```

| Method | Path | Description |
|---|---|---|
| GET | `/income-categories` | List all |
| POST | `/income-categories` | Create — body `{ "name": "Freelance" }` |
| DELETE | `/income-categories/{id}` | Delete |

---

## Expenses

`Expense`
```json
{
  "id": "e1",
  "date": "2026-08-02",
  "category": "Groceries",
  "amount": 4820,
  "note": "Monthly staples, Agora",
  "method": "bKash"
}
```
`method` — one of `Cash`, `bKash`, `Card`, `Bank transfer`.
`amount` — integer > 0 (required).
`note` — optional, defaults to `"Unspecified"`.

| Method | Path | Description |
|---|---|---|
| GET | `/expenses?month=2026-08` | List expenses; `month` filters by `date` prefix, omit for all |
| POST | `/expenses` | Create |
| GET | `/expenses/{id}` | Fetch one |
| PATCH | `/expenses/{id}` | Update |
| DELETE | `/expenses/{id}` | Delete |

`400 validation_error` if `amount <= 0`.

---

## Income

`Income`
```json
{
  "id": "n1",
  "date": "2026-08-01",
  "category": "Salary",
  "amount": 82000,
  "note": "August payroll"
}
```

| Method | Path | Description |
|---|---|---|
| GET | `/income?month=2026-08` | List income entries; `month` filters by `date` prefix |
| POST | `/income` | Create |
| GET | `/income/{id}` | Fetch one |
| PATCH | `/income/{id}` | Update |
| DELETE | `/income/{id}` | Delete |

Same amount/note validation as expenses.

---

## Projects (shared pots / savings goals)

A project pools money from multiple named members toward a target.

`Project`
```json
{
  "id": "p1",
  "name": "Sylhet retreat, August",
  "target": 90000,
  "note": "Four households, three nights, transport shared.",
  "members": ["Nayeem Hasan", "Farhana Rahim", "Rashed Karim", "Tanvir Alam"],
  "contributions": [
    { "id": "k1", "member": "Nayeem Hasan", "amount": 22000, "txn": "TRX-8842019", "date": "2026-07-28" }
  ]
}
```
`target` — integer, `0` means "open" (no target).
Members are free-text names, not linked user accounts.

| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List all, each with `members` and `contributions` embedded |
| POST | `/projects` | Create — body `{ "name": "...", "target": 90000, "note": "..." }`; creator is auto-added as first member |
| GET | `/projects/{id}` | Fetch one |
| PATCH | `/projects/{id}` | Update `name` / `target` / `note` |
| DELETE | `/projects/{id}` | Delete |
| POST | `/projects/{id}/members` | Add member — body `{ "name": "Shirin Ara" }`; no-op if already present |
| POST | `/projects/{id}/contributions` | Add contribution — body `{ "member": "...", "amount": 22000, "txn": "TRX-8842019" }`; `date` set server-side |
| DELETE | `/projects/{id}/contributions/{contributionId}` | Remove a contribution |

`400 validation_error`: contribution requires `amount > 0` and a non-empty `txn`.

---

## Debts (lending / borrowing)

`Debt`
```json
{
  "id": "d1",
  "kind": "lent",
  "person": "Rashed Karim",
  "amount": 12000,
  "date": "2026-07-19",
  "due": "2026-09-01",
  "note": "Bridge until his salary",
  "settled": false
}
```
`kind` — `lent` or `borrowed`. `due` optional. `date` set server-side on create.

| Method | Path | Description |
|---|---|---|
| GET | `/debts` | List all (open and settled) |
| POST | `/debts` | Create — body `{ "kind": "lent", "person": "...", "amount": 12000, "due": "2026-09-01", "note": "..." }` |
| GET | `/debts/{id}` | Fetch one |
| PATCH | `/debts/{id}` | Update mutable fields |
| DELETE | `/debts/{id}` | Delete |
| POST | `/debts/{id}/settle` | Mark `settled: true` |

`400 validation_error`: `person` required, `amount > 0` required.

---

## Dashboard / reports

Read-only aggregates computed server-side (no persisted resource — mirrors the
design's `renderVals()` derivations).

### `GET /dashboard?month=2026-08`
```json
{
  "month": "2026-08",
  "balance": 214830,
  "monthIncome": 124900,
  "monthExpense": 30480,
  "monthNet": 94420,
  "expenseCount": 11,
  "incomeCount": 4,
  "savingsRatePct": 76,
  "expenseByCategory": [ { "category": "Groceries", "amount": 13200, "pct": 43 } ],
  "incomeByCategory": [ { "category": "Salary", "amount": 82000, "pct": 66 } ],
  "budgets": [
    { "category": "Groceries", "spent": 13200, "limit": 12000, "over": true }
  ],
  "debts": { "lent": 20500, "borrowed": 31000, "net": -10500, "openCount": 4, "settledCount": 1 }
}
```

### `GET /dashboard/trend?months=6`
Monthly income/expense series for the trend chart.
```json
{
  "points": [
    { "month": "2026-03", "income": 112000, "expense": 71000 },
    { "month": "2026-08", "income": 124900, "expense": 30480 }
  ]
}
```

---

## Settings

`Settings`
```json
{ "currencySymbol": "৳", "density": "Comfortable", "showTrend": true }
```
`density` — `Comfortable` or `Compact`.

| Method | Path | Description |
|---|---|---|
| GET | `/settings` | Fetch current user's display preferences |
| PATCH | `/settings` | Update any subset of the fields above |

---

## Entity relationships

```
User 1──1 Settings
User 1──* ExpenseCategory
User 1──* IncomeCategory
User 1──* Expense ──* ExpenseCategory (by name)
User 1──* Income  ──* IncomeCategory (by name)
User 1──* Project 1──* member (free-text name)
Project 1──* Contribution ──* member (free-text name)
User 1──* Debt
```

Categories are referenced from expenses/income by `name`, matching the design's
storage model (not a foreign key to an id) — renaming a category does not
retroactively relabel past entries unless the API is extended to do so.
