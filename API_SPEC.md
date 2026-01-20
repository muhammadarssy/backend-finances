# API Spec — Personal Finance + Investing (REST)

**Base URL:** `/api/v1`

**Auth Header:**

* `Authorization: Bearer <token>`

**Response standar:**

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

---

# 1) AUTH

## 1.1 Register

**POST** `/auth/register`

Body:

```json
{
  "name": "Arssy",
  "email": "user@mail.com",
  "password": "secret123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": { "id": "xxx", "name": "Arssy", "email": "user@mail.com" }
  }
}
```

## 1.2 Login

**POST** `/auth/login`

Body:

```json
{
  "email": "user@mail.com",
  "password": "secret123"
}
```

## 1.3 Me

**GET** `/auth/me`

## 1.4 Logout

**POST** `/auth/logout` *(opsional)*

---

# 2) USERS / SETTINGS

## 2.1 Update profile

**PATCH** `/users/me`

Body:

```json
{
  "name": "New Name",
  "defaultCurrency": "IDR",
  "timezone": "Asia/Jakarta"
}
```

---

# 3) ACCOUNTS (WALLET)

## 3.1 List accounts

**GET** `/accounts`

Query (opsional):

* `type=CASH|BANK|EWALLET|INVESTMENT`
* `archived=false`

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "acc1",
      "name": "BCA",
      "type": "BANK",
      "currency": "IDR",
      "currentBalance": "1500000"
    }
  ]
}
```

## 3.2 Create account

**POST** `/accounts`

Body:

```json
{
  "name": "BCA",
  "type": "BANK",
  "currency": "IDR",
  "startingBalance": "1000000"
}
```

## 3.3 Get account detail

**GET** `/accounts/:id`

## 3.4 Update account

**PATCH** `/accounts/:id`

Body:

```json
{
  "name": "BCA Payroll",
  "isArchived": false
}
```

## 3.5 Delete account

**DELETE** `/accounts/:id` *(opsional, lebih aman pakai archive)*

---

# 4) CATEGORIES

## 4.1 List categories

**GET** `/categories`

Query:

* `type=INCOME|EXPENSE`
* `includeChildren=true`

## 4.2 Create category

**POST** `/categories`

Body:

```json
{
  "name": "Makan",
  "type": "EXPENSE",
  "parentId": null
}
```

## 4.3 Update category

**PATCH** `/categories/:id`

## 4.4 Archive category

**PATCH** `/categories/:id/archive`

Body:

```json
{ "isArchived": true }
```

---

# 5) TAGS

## 5.1 List tags

**GET** `/tags`

## 5.2 Create tag

**POST** `/tags`

Body:

```json
{ "name": "ngopi" }
```

## 5.3 Delete tag

**DELETE** `/tags/:id`

---

# 6) TRANSACTIONS (FINANCE)

## 6.1 List transactions

**GET** `/transactions`

Query (opsional):

* `type=INCOME|EXPENSE|TRANSFER`
* `accountId=...`
* `categoryId=...`
* `tagId=...`
* `from=2026-01-01`
* `to=2026-01-31`
* `q=keyword`
* `sort=occurredAt:desc`
* `page=1&limit=20`

## 6.2 Create transaction (income/expense)

**POST** `/transactions`

Body:

```json
{
  "type": "EXPENSE",
  "amount": "50000",
  "currency": "IDR",
  "occurredAt": "2026-01-19T10:00:00.000Z",
  "accountId": "acc1",
  "categoryId": "cat_food",
  "note": "sarapan",
  "tagIds": ["tag1", "tag2"],
  "receiptUrl": null
}
```

## 6.3 Create transfer

**POST** `/transactions/transfer`

Body:

```json
{
  "amount": "200000",
  "currency": "IDR",
  "occurredAt": "2026-01-19T10:00:00.000Z",
  "fromAccountId": "acc1",
  "toAccountId": "acc2",
  "note": "topup ewallet"
}
```

## 6.4 Get transaction detail

**GET** `/transactions/:id`

## 6.5 Update transaction

**PATCH** `/transactions/:id`

## 6.6 Soft delete transaction

**DELETE** `/transactions/:id`

---

# 7) BUDGETS

## 7.1 Get budget by month

**GET** `/budgets/current`

Query:

* `month=1&year=2026` *(opsional)*

Response:

```json
{
  "success": true,
  "data": {
    "id": "bud1",
    "month": 1,
    "year": 2026,
    "totalLimit": "3000000",
    "items": [
      {
        "categoryId": "cat_food",
        "limitAmount": "1000000",
        "spent": "250000"
      }
    ]
  }
}
```

## 7.2 Create/Update budget (upsert)

**PUT** `/budgets`

Body:

```json
{
  "month": 1,
  "year": 2026,
  "totalLimit": "3000000",
  "items": [
    { "categoryId": "cat_food", "limitAmount": "1000000" },
    { "categoryId": "cat_transport", "limitAmount": "500000" }
  ]
}
```

## 7.3 Delete budget

**DELETE** `/budgets/:id`

---

# 8) BILLS

## 8.1 List bills

**GET** `/bills`

Query:

* `status=PAID|UNPAID`
* `from=2026-01-01&to=2026-01-31`

## 8.2 Create bill

**POST** `/bills`

Body:

```json
{
  "name": "Internet",
  "amount": "350000",
  "currency": "IDR",
  "categoryId": "cat_bill",
  "accountId": "acc1",
  "dueDate": "2026-01-25T00:00:00.000Z",
  "reminderDays": [7, 3, 1]
}
```

## 8.3 Update bill

**PATCH** `/bills/:id`

## 8.4 Mark bill as paid

**POST** `/bills/:id/pay`

Body:

```json
{
  "paidAt": "2026-01-25T09:00:00.000Z",
  "amountPaid": "350000",
  "transactionId": "trx123"
}
```

## 8.5 Delete bill

**DELETE** `/bills/:id`

---

# 9) RECURRING TRANSACTIONS

## 9.1 List recurring rules

**GET** `/recurring`

## 9.2 Create recurring rule

**POST** `/recurring`

Body:

```json
{
  "name": "Gaji",
  "type": "INCOME",
  "amount": "5000000",
  "currency": "IDR",
  "categoryId": "cat_salary",
  "accountId": "acc1",
  "scheduleType": "MONTHLY",
  "scheduleValue": "25",
  "nextRunAt": "2026-02-25T00:00:00.000Z",
  "isActive": true
}
```

## 9.3 Update recurring rule

**PATCH** `/recurring/:id`

## 9.4 Enable/Disable recurring

**PATCH** `/recurring/:id/toggle`

Body:

```json
{ "isActive": false }
```

## 9.5 Run recurring manually

**POST** `/recurring/:id/run` *(internal/admin)*

---

# 10) INVESTING — ASSETS

## 10.1 List investment assets

**GET** `/invest/assets`

Query:

* `assetType=STOCK|CRYPTO|GOLD|FUND`
* `q=BBCA`

## 10.2 Create investment asset (manual)

**POST** `/invest/assets`

Body:

```json
{
  "symbol": "BBCA",
  "name": "Bank Central Asia",
  "assetType": "STOCK",
  "exchange": "IDX",
  "currency": "IDR"
}
```

## 10.3 Get asset detail

**GET** `/invest/assets/:id`

## 10.4 Update asset

**PATCH** `/invest/assets/:id`

---

# 11) INVESTING — TRANSACTIONS

## 11.1 List investment transactions

**GET** `/invest/transactions`

Query:

* `assetId=...`
* `type=BUY|SELL|DIVIDEND|FEE|DEPOSIT|WITHDRAW`
* `from=...&to=...`
* `page=1&limit=20`

## 11.2 Create investment transaction

**POST** `/invest/transactions`

Body (BUY):

```json
{
  "assetId": "asset1",
  "type": "BUY",
  "units": "10",
  "pricePerUnit": "9000",
  "feeAmount": "500",
  "taxAmount": "0",
  "occurredAt": "2026-01-19T10:00:00.000Z",
  "note": "avg down",
  "cashAccountId": "acc1"
}
```

Body (DIVIDEND):

```json
{
  "assetId": "asset1",
  "type": "DIVIDEND",
  "netAmount": "150000",
  "occurredAt": "2026-01-19T10:00:00.000Z",
  "note": "dividen Q4",
  "cashAccountId": "acc1"
}
```

## 11.3 Get investment transaction detail

**GET** `/invest/transactions/:id`

## 11.4 Update investment transaction

**PATCH** `/invest/transactions/:id`

## 11.5 Delete investment transaction

**DELETE** `/invest/transactions/:id`

---

# 12) INVESTING — PORTFOLIO / HOLDINGS

## 12.1 Portfolio summary

**GET** `/invest/portfolio/summary`

Response:

```json
{
  "success": true,
  "data": {
    "totalValue": "15000000",
    "unrealizedPL": "500000",
    "realizedPL": "200000",
    "allocation": [
      { "assetType": "STOCK", "value": "10000000" },
      { "assetType": "CRYPTO", "value": "5000000" }
    ]
  }
}
```

## 12.2 Holdings list

**GET** `/invest/holdings`

Query:

* `assetType=STOCK`

## 12.3 Holding detail

**GET** `/invest/holdings/:assetId`

## 12.4 Rebuild holdings

**POST** `/invest/holdings/rebuild` *(internal)*

---

# 13) WATCHLIST & ALERTS

## 13.1 Watchlist list

**GET** `/invest/watchlist`

## 13.2 Add to watchlist

**POST** `/invest/watchlist`

Body:

```json
{ "assetId": "asset1" }
```

## 13.3 Remove watchlist

**DELETE** `/invest/watchlist/:id`

## 13.4 List alerts

**GET** `/invest/alerts`

## 13.5 Create alert

**POST** `/invest/alerts`

Body:

```json
{
  "assetId": "asset1",
  "condition": "ABOVE",
  "targetPrice": "10000"
}
```

## 13.6 Disable alert

**PATCH** `/invest/alerts/:id`

Body:

```json
{ "isActive": false }
```

---

# 14) REPORTS (FINANCE + INVEST)

## 14.1 Monthly finance summary

**GET** `/reports/finance/monthly`

Query:

* `month=1&year=2026`

Response:

```json
{
  "success": true,
  "data": {
    "income": "5000000",
    "expense": "2500000",
    "cashflow": "2500000",
    "byCategory": [
      { "categoryId": "cat_food", "total": "500000" }
    ]
  }
}
```

## 14.2 Budget usage

**GET** `/reports/budget/usage`

Query:

* `month=1&year=2026`

## 14.3 Net worth report

**GET** `/reports/networth`

Query:

* `from=2026-01-01&to=2026-12-31&interval=month`

## 14.4 Investment performance

**GET** `/reports/invest/performance`

Query:

* `from=...&to=...`

---

# 15) EXPORT / BACKUP

## 15.1 Export finance transactions

**GET** `/export/transactions.csv`

Query:

* `from=...&to=...`

## 15.2 Export investment transactions

**GET** `/export/invest-transactions.csv`

## 15.3 Backup all (json)

**GET** `/backup/export.json`

## 15.4 Restore backup

**POST** `/backup/restore`

Body: `multipart/form-data` (file)

---

# 16) DEBT (OPSIONAL)

## 16.1 List debts

**GET** `/debts`

Query:

* `type=DEBT|RECEIVABLE`
* `status=OPEN|CLOSED`

## 16.2 Create debt

**POST** `/debts`

Body:

```json
{
  "type": "DEBT",
  "personName": "Budi",
  "amountTotal": "2000000",
  "amountRemaining": "2000000",
  "dueDate": "2026-02-01T00:00:00.000Z"
}
```

## 16.3 Add debt payment

**POST** `/debts/:id/payments`

Body:

```json
{
  "amountPaid": "500000",
  "paidAt": "2026-01-19T10:00:00.000Z",
  "transactionId": "trx1"
}
```

## 16.4 Close debt

**PATCH** `/debts/:id/close`

Body:

```json
{ "status": "CLOSED" }
```

---

# Validasi Rules (Wajib di Backend)

## Finance Transactions

* Jika `type=INCOME/EXPENSE` → `accountId` wajib
* Jika `type=TRANSFER` → `fromAccountId` & `toAccountId` wajib
* Transfer tidak boleh `fromAccountId == toAccountId`

## Investing Transactions

* Jika `type=BUY/SELL` → `units` & `pricePerUnit` wajib
* `netAmount` dihitung konsisten (gross - fee - tax) sesuai kebutuhan

## General

* `amount` wajib > 0
* Semua uang & unit pakai decimal
