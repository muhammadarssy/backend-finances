# TODO - Backend Finance & Investment API

## Tech Stack

### Core
- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Fastify
- **ORM**: Prisma (sudah ada)
- **Database**: PostgreSQL
- **Validation**: Zod atau Joi

### Authentication & Security
- **JWT**: jsonwebtoken atau jose
- **Password Hashing**: bcrypt atau argon2
- **CORS**: @fastify/cors
- **Rate Limiting**: @fastify/rate-limit

### Utilities
- **File Upload**: @fastify/multipart
- **CSV Export**: csv-stringify atau fast-csv
- **Date Handling**: date-fns atau dayjs
- **Error Handling**: Custom error handler middleware

### Development Tools
- **Testing**: Jest atau Vitest
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript compiler
- **Environment**: dotenv

### Optional (Future)
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Pino (built-in Fastify)
- **Monitoring**: Sentry
- **Cron Jobs**: node-cron (untuk recurring transactions)

---

## Phase 1: Setup & Infrastructure

### 1.1 Project Setup
- [x] Initialize TypeScript configuration (`tsconfig.json`)
- [x] Setup ESLint dan Prettier
- [x] Setup environment variables (`.env.example`, `.env`)
- [x] Setup database connection (DATABASE_URL)
- [x] Generate Prisma client (via npm script)
- [x] Setup folder structure:
  ```
  src/
    ├── config/
    │   ├── database.ts
    │   └── env.ts
    ├── controllers/
    ├── services/
    ├── middlewares/
    ├── routes/
    ├── utils/
    │   ├── errors.ts
    │   └── response.ts
    ├── types/
    ├── validators/
    ├── errors/
    ├── app.ts
    └── index.ts
  ```
- [x] Setup main entry point (`src/index.ts`)
- [x] Setup Fastify app dengan middleware dasar
- [x] Setup error handling middleware
- [x] Setup logging middleware (Pino dengan pino-pretty untuk dev)
- [x] Setup API documentation (Swagger/OpenAPI)
- [x] Setup health check endpoint
- [x] Setup graceful shutdown

### 1.2 Database & Prisma
- [x] Verifikasi schema Prisma sudah valid
- [x] Buat migration initial (jika belum) - *Jalankan `npm run prisma:migrate`*
- [x] Setup Prisma client instance (`src/config/database.ts`)
- [x] Buat database seeder (`prisma/seed.ts`) - *Jalankan `npm run prisma:seed`*

---

## Phase 2: Authentication & User Management

### 2.1 Authentication
- [x] **POST** `/api/v1/auth/register`
  - [x] Validasi input (name, email, password) - menggunakan Zod
  - [x] Hash password dengan bcrypt
  - [x] Create user di database
  - [x] Generate JWT token
  - [x] Return token dan user data
- [x] **POST** `/api/v1/auth/login`
  - [x] Validasi input (email, password) - menggunakan Zod
  - [x] Verify password
  - [x] Generate JWT token
  - [x] Return token dan user data
- [x] **GET** `/api/v1/auth/me`
  - [x] Verify JWT token (middleware)
  - [x] Get user dari token
  - [x] Return user data
- [ ] **POST** `/api/v1/auth/logout` (opsional - skip untuk sekarang)
  - [ ] Token blacklist (jika diperlukan)

### 2.2 Auth Middleware
- [x] Buat `verifyToken` middleware untuk verify JWT
- [x] Buat `requireAuth` middleware
- [x] Handle token expiration
- [x] Handle invalid token
- [x] Verify user still exists di database

### 2.3 User Settings
- [x] **PATCH** `/api/v1/users/me`
  - [x] Validasi input (name, defaultCurrency, timezone) - menggunakan Zod
  - [x] Update user profile
  - [x] Return updated user data

---

## Phase 3: Core Finance - Accounts & Categories

### 3.1 Accounts (Wallets)
- [x] **GET** `/api/v1/accounts`
  - [x] Filter by type (CASH, BANK, EWALLET, INVESTMENT)
  - [x] Filter by archived status
  - [x] Return list accounts dengan currentBalance
- [x] **POST** `/api/v1/accounts`
  - [x] Validasi input (name, type, currency, startingBalance) - menggunakan Zod
  - [x] Set currentBalance = startingBalance
  - [x] Create account
  - [x] Return created account
- [x] **GET** `/api/v1/accounts/:id`
  - [x] Verify ownership
  - [x] Return account detail
- [x] **PATCH** `/api/v1/accounts/:id`
  - [x] Validasi input (name, isArchived) - menggunakan Zod
  - [x] Verify ownership
  - [x] Update account
  - [x] Return updated account
- [ ] **DELETE** `/api/v1/accounts/:id` (opsional - skip untuk sekarang)
  - [ ] Verify ownership
  - [ ] Check dependencies (ada transactions/bills?)
  - [ ] Soft delete atau hard delete

### 3.2 Categories
- [x] **GET** `/api/v1/categories`
  - [x] Filter by type (INCOME, EXPENSE)
  - [x] Option includeChildren untuk nested categories
  - [x] Return list categories dengan parent/children relations
- [x] **POST** `/api/v1/categories`
  - [x] Validasi input (name, type, parentId optional) - menggunakan Zod
  - [x] Validate parentId exists dan type sama
  - [x] Prevent circular reference
  - [x] Create category
  - [x] Return created category
- [x] **PATCH** `/api/v1/categories/:id`
  - [x] Validasi input - menggunakan Zod
  - [x] Verify ownership
  - [x] Validate parent jika diupdate
  - [x] Update category
  - [x] Return updated category
- [x] **PATCH** `/api/v1/categories/:id/archive`
  - [x] Verify ownership
  - [x] Toggle isArchived
  - [x] Return updated category

### 3.3 Tags
- [x] **GET** `/api/v1/tags`
  - [x] Return list tags user
- [x] **POST** `/api/v1/tags`
  - [x] Validasi input (name, unique per user) - menggunakan Zod
  - [x] Create tag
  - [x] Return created tag
- [x] **DELETE** `/api/v1/tags/:id`
  - [x] Verify ownership
  - [x] Delete tag (cascade akan hapus TransactionTag)

---

## Phase 4: Transactions (Finance)

### 4.1 Transaction List & Detail
- [x] **GET** `/api/v1/transactions`
  - [x] Filter by type (INCOME, EXPENSE, TRANSFER)
  - [x] Filter by accountId
  - [x] Filter by categoryId
  - [x] Filter by tagId
  - [x] Filter by date range (from, to)
  - [x] Search by keyword (q) - di note
  - [x] Sort (occurredAt:desc atau custom)
  - [x] Pagination (page, limit)
  - [x] Return list transactions dengan relations (account, category, tags)
- [x] **GET** `/api/v1/transactions/:id`
  - [x] Verify ownership
  - [x] Return transaction detail dengan relations

### 4.2 Create Income/Expense Transaction
- [x] **POST** `/api/v1/transactions`
  - [x] Validasi input (type INCOME/EXPENSE) - menggunakan Zod
  - [x] Validate: type=INCOME/EXPENSE → accountId wajib
  - [x] Validate: categoryId sesuai dengan type
  - [x] Validate: amount > 0
  - [x] Update account currentBalance (atomic dengan transaction):
    - INCOME: currentBalance += amount
    - EXPENSE: currentBalance -= amount
  - [x] Create transaction
  - [x] Link tags (jika ada tagIds)
  - [x] Return created transaction dengan relations

### 4.3 Create Transfer Transaction
- [x] **POST** `/api/v1/transactions/transfer`
  - [x] Validasi input - menggunakan Zod
  - [x] Validate: fromAccountId != toAccountId
  - [x] Validate: fromAccountId dan toAccountId exists
  - [x] Update balances (atomic dengan transaction):
    - fromAccount: currentBalance -= amount
    - toAccount: currentBalance += amount
  - [x] Create transaction dengan type TRANSFER
  - [x] Return created transaction dengan relations

### 4.4 Update & Delete Transaction
- [x] **PATCH** `/api/v1/transactions/:id`
  - [x] Verify ownership
  - [x] Validasi input - menggunakan Zod
  - [x] Handle balance adjustment (reverse old, apply new) jika amount/account/type berubah
  - [x] Update transaction
  - [x] Update tags jika berubah
  - [x] Return updated transaction dengan relations
- [x] **DELETE** `/api/v1/transactions/:id`
  - [x] Verify ownership
  - [x] Soft delete (set isDeleted = true)
  - [x] Reverse balance changes (atomic):
    - INCOME: currentBalance -= amount
    - EXPENSE: currentBalance += amount
    - TRANSFER: reverse both accounts
  - [x] Return success

---

## Phase 5: Budgets

### 5.1 Budget Management
- [x] **GET** `/api/v1/budgets/current`
  - [x] Query month & year (default: current month)
  - [x] Get budget untuk bulan tersebut (return empty jika belum ada)
  - [x] Calculate spent per category dari transactions (EXPENSE type)
  - [x] Return budget dengan items dan spent amounts
- [x] **PUT** `/api/v1/budgets` (upsert)
  - [x] Validasi input (month, year, totalLimit, items[]) - menggunakan Zod
  - [x] Validate: month 1-12, year valid
  - [x] Validate: categoryIds exist, belong to user, dan type EXPENSE
  - [x] Validate: no duplicate categoryIds
  - [x] Upsert budget dan budget items (delete old, create new)
  - [x] Return budget dengan items
- [x] **DELETE** `/api/v1/budgets/:id`
  - [x] Verify ownership
  - [x] Delete budget dan budget items (cascade via Prisma)
  - [x] Return success

---

## Phase 6: Bills

### 6.1 Bill Management
- [x] **GET** `/api/v1/bills`
  - [x] Filter by status (PAID, UNPAID)
  - [x] Filter by date range (dueDate)
  - [x] Return list bills dengan payments, category, account
- [x] **POST** `/api/v1/bills`
  - [x] Validasi input (name, amount, currency, categoryId, accountId, dueDate, reminderDays) - menggunakan Zod
  - [x] Verify category dan account ownership
  - [x] Create bill dengan status UNPAID
  - [x] Return created bill dengan relations
- [x] **PATCH** `/api/v1/bills/:id`
  - [x] Verify ownership
  - [x] Validasi input - menggunakan Zod
  - [x] Verify category dan account jika diupdate
  - [x] Update bill
  - [x] Return updated bill dengan relations
- [x] **POST** `/api/v1/bills/:id/pay`
  - [x] Verify ownership
  - [x] Validasi input (paidAt, amountPaid, transactionId optional) - menggunakan Zod
  - [x] Verify transaction ownership jika ada transactionId
  - [x] Create BillPayment
  - [x] Calculate total paid dari semua payments
  - [x] Update bill status menjadi PAID jika totalPaid >= amount
  - [x] Return updated bill dengan payments
- [x] **DELETE** `/api/v1/bills/:id`
  - [x] Verify ownership
  - [x] Delete bill (cascade akan hapus BillPayment via Prisma)
  - [x] Return success

---

## Phase 7: Recurring Transactions

### 7.1 Recurring Rule Management
- [x] **GET** `/api/v1/recurring`
  - [x] Return list recurring rules user dengan last 5 runs
- [x] **POST** `/api/v1/recurring`
  - [x] Validasi input (name, type, amount, categoryId, accountId, scheduleType, scheduleValue, nextRunAt) - menggunakan Zod
  - [x] Validate: scheduleValue sesuai dengan scheduleType
  - [x] Verify category dan account ownership
  - [x] Validate category type match dengan rule type
  - [x] Create recurring rule
  - [x] Return created rule dengan relations
- [x] **PATCH** `/api/v1/recurring/:id`
  - [x] Verify ownership
  - [x] Validasi input - menggunakan Zod
  - [x] Validate scheduleValue jika diupdate
  - [x] Verify category dan account jika diupdate
  - [x] Update recurring rule
  - [x] Return updated rule dengan relations
- [x] **PATCH** `/api/v1/recurring/:id/toggle`
  - [x] Verify ownership
  - [x] Toggle isActive
  - [x] Return updated rule

### 7.2 Recurring Execution (Background Job)
- [x] **POST** `/api/v1/recurring/:id/run` (internal/admin)
  - [x] Verify rule isActive
  - [x] Check nextRunAt <= now
  - [x] Create transaction sesuai rule (atomic)
  - [x] Update account balance (atomic)
  - [x] Create RecurringRun record
  - [x] Calculate next nextRunAt berdasarkan scheduleType (DAILY, WEEKLY, MONTHLY, YEARLY)
  - [x] Update rule nextRunAt
  - [x] Return updated rule dengan transaction
- [ ] Setup cron job untuk auto-run recurring rules (opsional - bisa ditambahkan nanti)
  - [ ] Job untuk check dan execute recurring rules
  - [ ] Run setiap hari/jam

---

## Phase 8: Investment - Assets

### 8.1 Investment Assets
- [x] **GET** `/api/v1/invest/assets`
  - [x] Filter by assetType (STOCK, CRYPTO, GOLD, FUND, OTHER)
  - [x] Search by symbol/name (q) - case insensitive
  - [x] Return list assets
- [x] **POST** `/api/v1/invest/assets`
  - [x] Validasi input (symbol, name, assetType, exchange, currency) - menggunakan Zod
  - [x] Validate: symbol unique per user (userId_symbol unique constraint)
  - [x] Create investment asset
  - [x] Return created asset
- [x] **GET** `/api/v1/invest/assets/:id`
  - [x] Verify ownership
  - [x] Return asset detail
- [x] **PATCH** `/api/v1/invest/assets/:id`
  - [x] Verify ownership
  - [x] Validasi input - menggunakan Zod
  - [x] Validate symbol uniqueness jika symbol diupdate
  - [x] Update asset
  - [x] Return updated asset

---

## Phase 9: Investment - Transactions

### 9.1 Investment Transactions
- [x] **GET** `/api/v1/invest/transactions`
  - [x] Filter by assetId
  - [x] Filter by type (BUY, SELL, DIVIDEND, FEE, DEPOSIT, WITHDRAW)
  - [x] Filter by date range
  - [x] Pagination (page, limit)
  - [x] Return list transactions dengan asset dan cashAccount
- [x] **POST** `/api/v1/invest/transactions`
  - [x] Validasi input berdasarkan type - menggunakan Zod dengan refine:
    - BUY/SELL: units, pricePerUnit wajib
    - DIVIDEND/FEE/DEPOSIT/WITHDRAW: netAmount wajib
  - [x] Calculate netAmount otomatis untuk BUY/SELL (gross - fee - tax)
  - [x] Validate: netAmount > 0
  - [x] Create investment transaction (atomic)
  - [x] Update Holding jika type BUY/SELL:
    - BUY: add units, calculate weighted avgBuyPrice
    - SELL: subtract units, check units cukup, delete holding jika 0
  - [x] Update cashAccount balance jika ada cashAccountId:
    - BUY/DEPOSIT/FEE: decrease balance
    - SELL/DIVIDEND: increase balance
    - WITHDRAW: decrease balance
  - [x] Return created transaction dengan relations
- [x] **GET** `/api/v1/invest/transactions/:id`
  - [x] Verify ownership
  - [x] Return transaction detail dengan asset dan cashAccount
- [x] **PATCH** `/api/v1/invest/transactions/:id`
  - [x] Verify ownership
  - [x] Validasi input - menggunakan Zod
  - [x] Reverse old holding changes jika BUY/SELL
  - [x] Reverse old cash account balance
  - [x] Calculate new netAmount
  - [x] Apply new holding changes jika BUY/SELL
  - [x] Apply new cash account balance
  - [x] Update transaction
  - [x] Return updated transaction dengan relations
- [x] **DELETE** `/api/v1/invest/transactions/:id`
  - [x] Verify ownership
  - [x] Reverse holding changes (atomic)
  - [x] Reverse cashAccount balance (atomic)
  - [x] Delete transaction
  - [x] Return success

---

## Phase 10: Investment - Portfolio & Holdings

### 10.1 Holdings Management
- [x] **GET** `/api/v1/invest/holdings`
  - [x] Filter by assetType
  - [x] Return list holdings dengan asset info
  - [x] Calculate costBasis per holding
  - [x] Note: currentValue requires external price API
- [x] **GET** `/api/v1/invest/holdings/:assetId`
  - [x] Verify ownership (via asset)
  - [x] Return holding detail dengan asset info
  - [x] Return transaction history (last 50 transactions)

### 10.2 Portfolio Summary
- [x] **GET** `/api/v1/invest/portfolio/summary`
  - [x] Calculate totalValue dari holdings (cost basis - placeholder untuk current value)
  - [x] Calculate unrealizedPL (0 - requires current prices, note included)
  - [x] Calculate realizedPL dari SELL transactions (simplified calculation)
  - [x] Group by assetType untuk allocation
  - [x] Return portfolio summary dengan note tentang price integration

### 10.3 Holdings Rebuild (Internal)
- [x] **POST** `/api/v1/invest/holdings/rebuild`
  - [x] Clear all holdings user
  - [x] Recalculate holdings dari investment transactions (BUY/SELL only)
  - [x] Calculate weighted average buy price correctly
  - [x] Handle SELL transactions (subtract units, maintain avg price)
  - [x] Return success dengan summary (holdingsCreated, transactionsProcessed)

---

## Phase 11: Watchlist & Price Alerts

### 11.1 Watchlist
- [x] **GET** `/api/v1/invest/watchlist`
  - [x] Return list watchlist dengan asset info
  - [x] Order by createdAt desc
- [x] **POST** `/api/v1/invest/watchlist`
  - [x] Validasi input (assetId)
  - [x] Validate: asset exists dan owned by user
  - [x] Check duplicate (unique per user+asset)
  - [x] Create watchlist
  - [x] Return created watchlist dengan asset info
- [x] **DELETE** `/api/v1/invest/watchlist/:id`
  - [x] Verify ownership
  - [x] Delete watchlist
  - [x] Return success

### 11.2 Price Alerts
- [x] **GET** `/api/v1/invest/alerts`
  - [x] Return list alerts dengan asset info
  - [x] Filter by isActive (query param)
  - [x] Order by createdAt desc
- [x] **POST** `/api/v1/invest/alerts`
  - [x] Validasi input (assetId, condition, targetPrice)
  - [x] Validate: asset exists dan owned by user
  - [x] Validate targetPrice > 0
  - [x] Create price alert (isActive = true by default)
  - [x] Return created alert dengan asset info
- [x] **PATCH** `/api/v1/invest/alerts/:id`
  - [x] Verify ownership
  - [x] Update isActive (reset triggeredAt jika reactivate)
  - [x] Update condition (optional)
  - [x] Update targetPrice (optional)
  - [x] Return updated alert
- [x] **DELETE** `/api/v1/invest/alerts/:id`
  - [x] Verify ownership
  - [x] Delete price alert
  - [x] Return success
- [ ] Setup background job untuk check price alerts (opsional - untuk later)
  - [ ] Check alerts terhadap current price
  - [ ] Trigger alert jika condition met
  - [ ] Update triggeredAt dan isActive

---

## Phase 12: Reports

### 12.1 Finance Reports
- [x] **GET** `/api/v1/reports/finance/monthly`
  - [x] Query month & year (validation)
  - [x] Calculate total income (from INCOME transactions)
  - [x] Calculate total expense (from EXPENSE transactions)
  - [x] Calculate cashflow (income - expense)
  - [x] Group by category untuk byCategory (expense only)
  - [x] Return monthly summary dengan category breakdown
- [x] **GET** `/api/v1/reports/budget/usage`
  - [x] Query month & year (validation)
  - [x] Get budget untuk bulan tersebut (dengan items)
  - [x] Calculate spent per category dari transactions
  - [x] Compare dengan limit (budgeted vs spent)
  - [x] Calculate percentage dan isOverBudget flag
  - [x] Return budget usage report dengan totals
- [x] **GET** `/api/v1/reports/networth`
  - [x] Query from, to, interval (day/month, default: month)
  - [x] Calculate current net worth:
    - Total account balances
    + Total investment value (holdings cost basis)
  - [x] Generate timeline per interval (simplified - uses current value)
  - [x] Return net worth timeline dengan current breakdown
  - [x] Note: Historical calculation requires transaction history (simplified for now)

### 12.2 Investment Reports
- [x] **GET** `/api/v1/reports/invest/performance`
  - [x] Query from, to (date validation)
  - [x] Calculate total invested (cost basis dari holdings)
  - [x] Calculate realized P/L dari SELL transactions
  - [x] Calculate total return dan ROI percentage
  - [x] Group by asset (invested per asset)
  - [x] Group by assetType (allocation percentage)
  - [x] Return performance report dengan summary dan breakdowns
  - [x] Note: Current value dan unrealized P/L require price API

---

## Phase 13: Export & Backup

### 13.1 CSV Export
- [x] **GET** `/api/v1/export/transactions.csv`
  - [x] Query from, to (optional, validation)
  - [x] Get transactions dalam range (exclude deleted)
  - [x] Include account, category, tags info
  - [x] Format ke CSV dengan columns: Date, Type, Description, Amount, Currency, Account, Category, Tags, Notes
  - [x] Return CSV file dengan proper headers
- [x] **GET** `/api/v1/export/invest-transactions.csv`
  - [x] Query from, to (optional, validation)
  - [x] Get investment transactions dalam range
  - [x] Include asset, account info
  - [x] Format ke CSV dengan columns: Date, Type, Asset, AssetType, Units, PricePerUnit, NetAmount, Fee, Currency, Account, Notes
  - [x] Return CSV file dengan proper headers

### 13.2 Backup & Restore
- [x] **GET** `/api/v1/backup/export.json`
  - [x] Export semua data user:
    - [x] User profile (id, email, name)
    - [x] Accounts (non-archived)
    - [x] Categories (non-deleted, dengan hierarchy)
    - [x] Tags
    - [x] Transactions (non-deleted, dengan tags)
    - [x] Budgets (dengan items)
    - [x] Bills (non-deleted)
    - [x] Recurring rules (active)
    - [x] Investment assets
    - [x] Investment transactions
    - [x] Holdings
    - [x] Watchlist
    - [x] Price alerts
    - [x] Debts (non-deleted)
  - [x] Format ke JSON dengan version dan exportedAt
  - [x] Convert Decimal ke string untuk JSON compatibility
  - [x] Return JSON file dengan proper headers
- [x] **POST** `/api/v1/backup/restore`
  - [x] Upload file (multipart/form-data dengan @fastify/multipart)
  - [x] Parse JSON dari file buffer
  - [x] Validate structure (version, data)
  - [x] Restore data dalam transaction (atomic):
    - [x] Accounts (upsert)
    - [x] Categories (handle hierarchy, upsert)
    - [x] Tags (upsert)
    - [x] Transactions (upsert, handle tags)
    - [x] Budgets (upsert dengan items)
    - [x] Bills (upsert)
    - [x] Recurring rules (upsert)
    - [x] Investment assets (upsert)
    - [x] Investment transactions (upsert)
    - [x] Watchlist (upsert)
    - [x] Price alerts (upsert)
    - [x] Debts (upsert)
  - [x] Note: Holdings akan di-rebuild via rebuild endpoint
  - [x] Return success dengan message

---

## Phase 14: Debt Management (Optional)

### 14.1 Debt CRUD
- [x] **GET** `/api/v1/debts`
  - [x] Filter by type (DEBT, RECEIVABLE)
  - [x] Filter by status (OPEN, CLOSED)
  - [x] Return list debts dengan payments (ordered by paidAt desc)
  - [x] Order by createdAt desc
- [x] **GET** `/api/v1/debts/:id`
  - [x] Verify ownership
  - [x] Return debt detail dengan payments
- [x] **POST** `/api/v1/debts`
  - [x] Validasi input (type, personName, amountTotal, amountRemaining, dueDate, interestRate, minimumPayment optional)
  - [x] Validate: amountRemaining <= amountTotal
  - [x] Auto-set status CLOSED jika amountRemaining <= 0
  - [x] Create debt
  - [x] Return created debt dengan payments
- [x] **PUT** `/api/v1/debts/:id`
  - [x] Verify ownership
  - [x] Validasi input (all fields optional)
  - [x] Validate: amountRemaining <= amountTotal
  - [x] Auto-update status berdasarkan amountRemaining
  - [x] Update debt
  - [x] Return updated debt
- [x] **DELETE** `/api/v1/debts/:id`
  - [x] Verify ownership
  - [x] Delete debt (hard delete, cascade payments)
  - [x] Return success

### 14.2 Debt Payments
- [x] **POST** `/api/v1/debts/:id/payments`
  - [x] Verify ownership
  - [x] Validasi input (amountPaid required, paidAt optional, transactionId optional)
  - [x] Validate: debt status must be OPEN
  - [x] Validate: amountPaid <= amountRemaining
  - [x] Verify transaction ownership jika transactionId provided
  - [x] Create DebtPayment dalam transaction
  - [x] Update debt amountRemaining (atomic)
  - [x] Auto-update debt status ke CLOSED jika amountRemaining <= 0
  - [x] Return updated debt dengan payments
- [x] **PATCH** `/api/v1/debts/:id/close`
  - [x] Verify ownership
  - [x] Validasi input (status must be CLOSED)
  - [x] Update status ke CLOSED
  - [x] Return updated debt

---

## Phase 15: Testing & Documentation

### 15.1 Unit Tests
- [x] Setup testing framework (Vitest)
- [x] Write tests untuk utilities (errors, jwt)
- [x] Write tests untuk validators (auth)
- [ ] Write tests untuk services (optional - bisa ditambahkan later)
- [x] Add test scripts ke package.json
- [x] Setup vitest.config.ts

### 15.2 Integration Tests
- [ ] Setup test database (optional - untuk later)
- [ ] Write tests untuk API endpoints (optional - untuk later)
- [ ] Test authentication flow (optional - untuk later)
- [ ] Test transaction flow dengan balance updates (optional - untuk later)

### 15.3 Documentation
- [x] API documentation (Swagger/OpenAPI) - sudah ada di semua endpoints
- [x] README.md dengan setup instructions - updated
- [x] Environment variables documentation - updated
- [x] API endpoint examples - updated
- [x] Testing instructions - added
- [x] API endpoints overview - added
- [x] Production deployment guide - added

---

## Phase 16: Deployment & Production

### 16.1 Production Readiness
- [ ] Error logging setup
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Security headers
- [ ] Input sanitization
- [ ] SQL injection prevention (Prisma handles this)

### 16.2 Database
- [ ] Production database setup
- [ ] Migration strategy
- [ ] Backup strategy
- [ ] Connection pooling

### 16.3 Deployment
- [ ] Dockerfile
- [ ] docker-compose.yml (untuk development)
- [ ] CI/CD pipeline (optional)
- [ ] Environment configuration

---

## Notes & Considerations

### Balance Management
- Balance harus konsisten dan atomic
- Gunakan database transactions untuk balance updates
- Handle concurrency issues

### Recurring Transactions
- Butuh background job (cron) untuk auto-execute
- Consider timezone handling
- Calculate nextRunAt dengan benar berdasarkan scheduleType

### Investment Holdings
- Holdings harus selalu sync dengan transactions
- Rebuild mechanism untuk recovery
- Handle edge cases (partial sells, etc.)

### Price Data (Future Enhancement)
- Current implementation tidak ada real-time price
- Portfolio summary butuh external price API
- Price alerts butuh external price checking

### Soft Delete vs Hard Delete
- Transactions: soft delete (isDeleted flag)
- Accounts, Categories: consider soft delete
- Tags: hard delete (cascade via Prisma)

### Validation Rules
- Semua amount/Decimal harus > 0
- Transfer: fromAccount != toAccount
- Category type harus match transaction type
- ScheduleValue validation berdasarkan scheduleType

### Performance
- Add indexes untuk query optimization (sudah ada di schema)
- Pagination untuk list endpoints
- Consider caching untuk reports (optional)
