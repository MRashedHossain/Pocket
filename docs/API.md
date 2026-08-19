# Pocket API

REST API for **Pocket**, a personal/household expense tracker.
Derived from the UI/UX design in `references/design/`.

## Conventions

- Base path: `/api/v1`
- Format: JSON request/response bodies, `Content-Type: application/json`
- Auth: `Authorization: Bearer <token>` on every endpoint except `POST /auth/register` and `POST /auth/login`
- Dates: `YYYY-MM-DD` (ISO 8601, no time component); server sets `date` on create unless stated otherwise
- Month keys: `YYYY-MM`, used for filtering by month
- Money: integer, major currency unit (e.g. BDT Taka, no decimals). Currency symbol is a display-only user setting (`settings.currencySymbol`, default `৳`)
- IDs: opaque strings, server-generated
- `PATCH` is always partial — only supplied fields are updated
- List endpoints accept optional `?page=1&limit=20` for pagination; omit to return all
- Errors:

```json
{ "error": { "code": "validation_error", "message": "Enter an amount greater than zero." } }
```

- Standard status codes: `200` OK, `201` Created, `204` No Content, `400` validation,
  `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `429` too many requests.

---

## Auth

### `POST /auth/register`
Register a new user.
Request:
```json
{ "name": "Nayeem Hasan", "email": "n.hasan@ledger.bd", "password": "•••••" }
```
Response `201`:
```json
{ "token": "<jwt>", "user": { "id": "u1", "name": "Nayeem Hasan", "email": "n.hasan@pocket.app" } }
```
`400` if any field is missing, email already taken, or password too short.

### `POST /auth/login`
Request:
```json
{ "email": "n.hasan@pocket.app", "password": "•••••" }
```
Response `200`:
```json
{ "token": "<jwt>", "user": { "id": "u1", "name": "Nayeem Hasan", "email": "n.hasan@pocket.app" } }
```
`400` if either field missing; `401` if credentials invalid.

### `POST /auth/logout`
`204`. Invalidates the bearer token server-side.

### `GET /auth/me`
Returns the current user profile.
```json
{ "id": "u1", "name": "Nayeem Hasan", "email": "n.hasan@pocket.app" }
```

### `PATCH /auth/me`
Update profile fields. Body (all fields optional):
```json
{ "name": "Nayeem H.", "email": "new@ledger.bd", "password": "•••••" }
```
Response `200` — updated user object.

---

## Dashboard

Read-only aggregates computed server-side.

### `GET /dashboard?month=2026-08`
Full dashboard payload for a given month.
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
  "expenseByCategory": [
    { "category": "Groceries", "amount": 13200, "pct": 43 }
  ],
  "incomeByCategory": [
    { "category": "Salary", "amount": 82000, "pct": 66 }
  ],
  "budgets": [
    { "category": "Groceries", "spent": 13200, "limit": 12000, "overLimit": true }
  ],
  "debts": {
    "lent": 20500,
    "borrowed": 31000,
    "net": -10500,
    "openCount": 4,
    "settledCount": 1
  }
}
```

### `GET /dashboard/summary?month=2026-08`
Lightweight summary for header widgets.
```json
{
  "month": "2026-08",
  "balance": 214830,
  "monthIncome": 124900,
  "monthExpense": 30480,
  "monthNet": 94420
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
`amount` — integer > 0 (required). `note` — optional, defaults to `"Unspecified"`.

| Method | Path | Description |
|---|---|---|
| GET | `/income?month=2026-08` | List income entries; omit `month` for all |
| POST | `/income` | Create — body `{ date, category, amount, note? }` |
| GET | `/income/{id}` | Fetch one |
| PATCH | `/income/{id}` | Update any mutable field |
| DELETE | `/income/{id}` | Delete |

### Income categories

`IncomeCategory`
```json
{ "id": "i1", "name": "Salary" }
```

| Method | Path | Description |
|---|---|---|
| GET | `/income/categories` | List all |
| POST | `/income/categories` | Create — body `{ "name": "Freelance" }` |
| PATCH | `/income/categories/{id}` | Rename — body `{ "name": "Consulting" }` |
| DELETE | `/income/categories/{id}` | Delete |

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
`amount` — integer > 0 (required). `note` — optional, defaults to `"Unspecified"`.

| Method | Path | Description |
|---|---|---|
| GET | `/expenses?month=2026-08` | List expenses; omit `month` for all |
| POST | `/expenses` | Create — body `{ date, category, amount, note?, method? }` |
| GET | `/expenses/{id}` | Fetch one |
| PATCH | `/expenses/{id}` | Update any mutable field |
| DELETE | `/expenses/{id}` | Delete |

`400 validation_error` if `amount <= 0`.

### Expense categories

`ExpenseCategory`
```json
{ "id": "c1", "name": "Groceries", "limit": 12000 }
```
`limit` — integer, `0` means no ceiling.

| Method | Path | Description |
|---|---|---|
| GET | `/expense-categories` | List all |
| POST | `/expense-categories` | Create — body `{ "name": "Schooling", "limit": 5000 }` |
| PATCH | `/expense-categories/{id}` | Update — body `{ name?, limit? }` |
| DELETE | `/expense-categories/{id}` | Delete |

---

## Budgets

A budget sets a spending ceiling for an expense category within a given month.
`spent` and `remaining` are computed server-side from expenses in that month.

`Budget`
```json
{
  "id": "b1",
  "category": "Groceries",
  "month": "2026-08",
  "limit": 12000,
  "spent": 8400,
  "remaining": 3600,
  "overLimit": false
}
```

| Method | Path | Description |
|---|---|---|
| GET | `/budgets?month=2026-08` | List budgets; omit `month` for all |
| POST | `/budgets` | Create — body `{ "category": "Groceries", "month": "2026-08", "limit": 12000 }` |
| GET | `/budgets/{id}` | Fetch one |
| PATCH | `/budgets/{id}` | Update `category`, `month`, or `limit` |
| DELETE | `/budgets/{id}` | Delete |

### `GET /budgets/summary?month=2026-08`
Aggregate across all budgets for the month.
```json
{
  "month": "2026-08",
  "totalLimit": 50000,
  "totalSpent": 31200,
  "totalRemaining": 18800,
  "overLimitCount": 1,
  "budgetCount": 5
}
```

### `GET /budgets/{id}/usage`
Spending breakdown within a specific budget.
```json
{
  "budget": { "id": "b1", "category": "Groceries", "month": "2026-08", "limit": 12000 },
  "spent": 8400,
  "remaining": 3600,
  "overLimit": false,
  "expenses": [
    { "id": "e1", "date": "2026-08-02", "amount": 4820, "note": "Agora run" }
  ]
}
```

---

## Accounts / Wallets

An account represents a real-world money source (cash, bank, MFS, card).
`balance` is maintained by the server based on recorded deposits/withdrawals,
or can be set directly via `PATCH`.

`Account`
```json
{
  "id": "a1",
  "name": "bKash",
  "type": "mobile_banking",
  "balance": 14500,
  "note": "Personal MFS"
}
```
`type` — one of `cash`, `bank`, `mobile_banking`, `card`.

| Method | Path | Description |
|---|---|---|
| GET | `/accounts` | List all accounts |
| POST | `/accounts` | Create — body `{ "name": "bKash", "type": "mobile_banking", "balance": 0, "note?" }` |
| GET | `/accounts/{id}` | Fetch one |
| PATCH | `/accounts/{id}` | Update `name`, `type`, `balance`, or `note` |
| DELETE | `/accounts/{id}` | Delete |

### `GET /accounts/{id}/balance`
```json
{ "id": "a1", "name": "bKash", "balance": 14500 }
```

---

## Debts (Lending / Borrowing)

Tracks money you lent out or borrowed. Supports **partial payments** — each
repayment is recorded individually, and `paidAmount` / `remaining` are updated
automatically. `settled` becomes `true` once `remaining == 0`, but can also be
forced via `PATCH /debts/{id}`.

`Debt`
```json
{
  "id": "d1",
  "kind": "lent",
  "person": "Rashed Karim",
  "amount": 500,
  "paidAmount": 200,
  "remaining": 300,
  "date": "2026-07-19",
  "due": "2026-09-01",
  "note": "Bridge until his salary",
  "settled": false
}
```
`kind` — `lent` or `borrowed`. `due` — optional due date. `date` set server-side on create.
`paidAmount` and `remaining` are read-only computed fields.

| Method | Path | Description |
|---|---|---|
| GET | `/debts?kind=lent` | List all debts; optional `kind` filter |
| POST | `/debts` | Create — body `{ "kind": "lent", "person": "...", "amount": 500, "due?", "note?" }` |
| GET | `/debts/{id}` | Fetch one |
| PATCH | `/debts/{id}` | Update `person`, `due`, `note`, or force `settled: true` |
| DELETE | `/debts/{id}` | Delete |

`400 validation_error`: `person` required, `amount > 0` required.

### Debt payments (partial repayment)

`Payment`
```json
{ "id": "pay1", "amount": 200, "date": "2026-08-10", "note": "First installment" }
```

**Example flow:** Lend 500 → record payment of 200 → `paidAmount: 200, remaining: 300, settled: false`.
Record another payment of 300 → `paidAmount: 500, remaining: 0, settled: true`.

| Method | Path | Description |
|---|---|---|
| POST | `/debts/{id}/payments` | Record a payment — body `{ "amount": 200, "note?" }`; `date` set server-side |
| GET | `/debts/{id}/payments` | List all payments for this debt |
| DELETE | `/debts/{id}/payments/{paymentId}` | Remove a payment; recalculates `paidAmount` / `remaining` |

`400 validation_error` if `amount <= 0` or `amount > remaining`.

### Debt aggregates

### `GET /debts/summary`
```json
{
  "totalLent": 20500,
  "totalBorrowed": 31000,
  "totalLentPaid": 8000,
  "totalBorrowedPaid": 12000,
  "netOwed": -10500,
  "openCount": 4,
  "settledCount": 1
}
```

### `GET /debts/upcoming`
Open debts with `due` date within the next 7 days, sorted by `due` ascending.
Returns an array of `Debt` objects.

### `GET /debts/overdue`
Open debts where `due < today`, sorted by `due` ascending (oldest first).
Returns an array of `Debt` objects.

---

## Projects (Shared Pots / Savings Goals)

A project pools contributions from multiple named members toward a target amount.
Members are free-text names, not linked user accounts.

`Project`
```json
{
  "id": "p1",
  "name": "Sylhet retreat, August",
  "target": 90000,
  "note": "Four households, three nights, transport shared.",
  "members": ["Nayeem Hasan", "Farhana Rahim", "Rashed Karim", "Tanvir Alam"]
}
```
`target` — integer, `0` means open (no target).

| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List all projects |
| POST | `/projects` | Create — body `{ "name": "...", "target": 90000, "note?" }`; creator auto-added as first member |
| GET | `/projects/{id}` | Fetch one with `members` and `contributions` embedded |
| PATCH | `/projects/{id}` | Update `name`, `target`, or `note` |
| DELETE | `/projects/{id}` | Delete |

### Project members

| Method | Path | Description |
|---|---|---|
| GET | `/projects/{id}/members` | List members |
| POST | `/projects/{id}/members` | Add member — body `{ "name": "Shirin Ara" }`; no-op if already present |
| GET | `/projects/{id}/members/{memberId}` | Member detail with their contributions |
| DELETE | `/projects/{id}/members/{memberId}` | Remove member (only if they have no contributions) |

`GET /projects/{id}/members/{memberId}` response:
```json
{
  "name": "Nayeem Hasan",
  "totalContributed": 22000,
  "contributions": [
    { "id": "k1", "amount": 22000, "txn": "TRX-8842019", "date": "2026-07-28" }
  ]
}
```

### Project contributions

`Contribution`
```json
{ "id": "k1", "member": "Nayeem Hasan", "amount": 22000, "txn": "TRX-8842019", "date": "2026-07-28" }
```

| Method | Path | Description |
|---|---|---|
| GET | `/projects/{id}/contributions` | List all contributions |
| POST | `/projects/{id}/contributions` | Add — body `{ "member": "...", "amount": 22000, "txn": "TRX-8842019" }`; `date` set server-side |
| GET | `/projects/{id}/contributions/{contributionId}` | Fetch one |
| PATCH | `/projects/{id}/contributions/{contributionId}` | Update `member`, `amount`, or `txn` |
| DELETE | `/projects/{id}/contributions/{contributionId}` | Remove |

`400 validation_error`: `amount > 0` and non-empty `txn` required.

### `GET /projects/{id}/summary`
```json
{
  "target": 90000,
  "totalContributed": 64000,
  "remaining": 26000,
  "pct": 71,
  "memberCount": 4
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

### Settings categories (global)

Global categories available across income and expense entry forms.

| Method | Path | Description |
|---|---|---|
| POST | `/settings/categories` | Create a global category — body `{ "name": "...", "kind": "income" \| "expense" }` |
| PATCH | `/settings/categories/{id}` | Rename — body `{ "name": "..." }` |
| DELETE | `/settings/categories/{id}` | Delete |

---

## Entity Relationships

```
User 1──1 Settings
User 1──* ExpenseCategory
User 1──* IncomeCategory
User 1──* Expense        ──> ExpenseCategory (by name)
User 1──* Income         ──> IncomeCategory (by name)
User 1──* Budget         ──> ExpenseCategory (by name)
User 1──* Account
User 1──* Project
  Project 1──* Member (free-text name)
  Project 1──* Contribution ──> Member (by name)
User 1──* Debt
  Debt 1──* Payment
```

Categories are referenced from expenses/income/budgets by `name`, not by foreign key.
Renaming a category does not retroactively relabel past entries.
