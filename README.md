# Backend Finance & Investment API

Backend API untuk Personal Finance dan Investment Management menggunakan Fastify dan Prisma.

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Fastify
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Validation**: Zod
- **API Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js v18 atau lebih tinggi
- PostgreSQL database
- npm atau yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan konfigurasinya:

```bash
cp .env.example .env
```

Edit `.env` dan set:
- `DATABASE_URL`: Connection string ke PostgreSQL database (required)
- `JWT_SECRET`: Secret key untuk JWT token (required)
- `JWT_EXPIRES_IN`: JWT token expiration (default: "7d")
- `PORT`: Port untuk server (default: 3000)
- `NODE_ENV`: Environment (development/production, default: "development")
- `HOST`: Server host (default: "0.0.0.0")
- `CORS_ORIGIN`: CORS allowed origins (default: "*" untuk development)

### 3. Setup Database

Generate Prisma client:

```bash
npm run prisma:generate
```

Jalankan migration:

```bash
npm run prisma:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## API Documentation

Setelah server running, dokumentasi API tersedia di:

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs/json

## Health Check

```bash
curl http://localhost:3000/health
```

## Scripts

- `npm run dev` - Run development server dengan hot reload
- `npm run build` - Build untuk production
- `npm run start` - Run production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed database dengan sample data
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting errors
- `npm run format` - Format code dengan Prettier
- `npm run typecheck` - Type check tanpa build
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests dengan coverage report

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # Prisma client instance
│   └── env.ts       # Environment variables
├── routes/          # API routes
├── controllers/     # Route controllers
├── services/        # Business logic
├── middlewares/     # Custom middlewares
├── utils/           # Utility functions
│   ├── errors.ts    # Error handling
│   └── response.ts  # Response helpers
├── types/           # TypeScript types
├── validators/      # Zod schemas
├── errors/          # Custom error classes
├── app.ts           # Fastify app setup
└── index.ts         # Entry point
```

## Development

### Adding New Routes

1. Buat route file di `src/routes/`
2. Export route function
3. Register di `src/app.ts`

Contoh:

```typescript
// src/routes/example.ts
import { FastifyInstance } from "fastify";

export default async function exampleRoutes(fastify: FastifyInstance) {
  fastify.get("/example", async (request, reply) => {
    return { message: "Hello World" };
  });
}
```

```typescript
// src/app.ts
import exampleRoutes from "./routes/example.js";

// ...
await app.register(exampleRoutes, { prefix: "/api/v1/example" });
```

### Error Handling

Gunakan custom error classes dari `src/utils/errors.ts`:

```typescript
import { NotFoundError, ValidationError } from "../utils/errors.js";

if (!resource) {
  throw new NotFoundError("Resource not found");
}
```

### API Response Format

Semua response mengikuti format:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Untuk error:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

## API Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile

### Accounts (Wallets)
- `GET /api/v1/accounts` - List accounts
- `POST /api/v1/accounts` - Create account
- `GET /api/v1/accounts/:id` - Get account detail
- `PUT /api/v1/accounts/:id` - Update account
- `PATCH /api/v1/accounts/:id/archive` - Archive account

### Categories
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `GET /api/v1/categories/:id` - Get category detail
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### Transactions
- `GET /api/v1/transactions` - List transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions/:id` - Get transaction detail
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction

### Budgets
- `GET /api/v1/budgets` - List budgets
- `POST /api/v1/budgets` - Create budget
- `GET /api/v1/budgets/:id` - Get budget detail
- `PUT /api/v1/budgets/:id` - Update budget
- `DELETE /api/v1/budgets/:id` - Delete budget

### Bills
- `GET /api/v1/bills` - List bills
- `POST /api/v1/bills` - Create bill
- `GET /api/v1/bills/:id` - Get bill detail
- `PUT /api/v1/bills/:id` - Update bill
- `DELETE /api/v1/bills/:id` - Delete bill
- `POST /api/v1/bills/:id/pay` - Pay bill

### Investment Assets
- `GET /api/v1/invest/assets` - List investment assets
- `POST /api/v1/invest/assets` - Create investment asset
- `GET /api/v1/invest/assets/:id` - Get asset detail
- `PUT /api/v1/invest/assets/:id` - Update asset
- `DELETE /api/v1/invest/assets/:id` - Delete asset

### Investment Transactions
- `GET /api/v1/invest/transactions` - List investment transactions
- `POST /api/v1/invest/transactions` - Create investment transaction
- `GET /api/v1/invest/transactions/:id` - Get transaction detail
- `PUT /api/v1/invest/transactions/:id` - Update transaction
- `DELETE /api/v1/invest/transactions/:id` - Delete transaction

### Portfolio & Holdings
- `GET /api/v1/invest/portfolio/summary` - Get portfolio summary
- `GET /api/v1/invest/holdings` - List holdings
- `GET /api/v1/invest/holdings/:assetId` - Get holding detail
- `POST /api/v1/invest/holdings/rebuild` - Rebuild holdings

### Watchlist & Alerts
- `GET /api/v1/invest/watchlist` - List watchlist
- `POST /api/v1/invest/watchlist` - Add to watchlist
- `DELETE /api/v1/invest/watchlist/:id` - Remove from watchlist
- `GET /api/v1/invest/alerts` - List price alerts
- `POST /api/v1/invest/alerts` - Create price alert
- `PATCH /api/v1/invest/alerts/:id` - Update price alert
- `DELETE /api/v1/invest/alerts/:id` - Delete price alert

### Reports
- `GET /api/v1/reports/finance/monthly` - Monthly finance summary
- `GET /api/v1/reports/budget/usage` - Budget usage report
- `GET /api/v1/reports/networth` - Net worth report
- `GET /api/v1/reports/invest/performance` - Investment performance report

### Export & Backup
- `GET /api/v1/export/transactions.csv` - Export finance transactions
- `GET /api/v1/export/invest-transactions.csv` - Export investment transactions
- `GET /api/v1/backup/export.json` - Export all data
- `POST /api/v1/backup/restore` - Restore from backup

### Debts
- `GET /api/v1/debts` - List debts
- `POST /api/v1/debts` - Create debt
- `GET /api/v1/debts/:id` - Get debt detail
- `PUT /api/v1/debts/:id` - Update debt
- `DELETE /api/v1/debts/:id` - Delete debt
- `POST /api/v1/debts/:id/payments` - Record debt payment
- `PATCH /api/v1/debts/:id/close` - Close debt

## Testing

### Setup

Tests menggunakan Vitest. Untuk menjalankan tests:

```bash
# Install dependencies (termasuk dev dependencies)
npm install

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests dengan coverage
npm run test:coverage
```

### Test Structure

```
src/
├── utils/
│   └── __tests__/
│       ├── errors.test.ts
│       └── jwt.test.ts
├── validators/
│   └── __tests__/
│       └── auth.test.ts
└── services/
    └── __tests__/
        └── (service tests)
```

### Writing Tests

Contoh test untuk service:

```typescript
import { describe, it, expect } from "vitest";
import { someServiceFunction } from "../service.js";

describe("Service Tests", () => {
  it("should do something", () => {
    const result = someServiceFunction();
    expect(result).toBeDefined();
  });
});
```

## API Usage Examples

### Authentication

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Using Authentication Token

Setelah login, gunakan token di header:

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <your-token>"
```

### Create Transaction

```bash
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EXPENSE",
    "description": "Lunch",
    "amount": "50000",
    "occurredAt": "2026-01-20T12:00:00.000Z",
    "accountId": "<account-id>",
    "categoryId": "<category-id>"
  }'
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `JWT_EXPIRES_IN` | JWT token expiration | No | "7d" |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | "development" |
| `HOST` | Server host | No | "0.0.0.0" |
| `CORS_ORIGIN` | CORS allowed origins | No | "*" (dev) |

## Production Deployment

### Build

```bash
npm run build
```

### Run Production Server

```bash
npm run start
```

### Environment Setup

Pastikan untuk set environment variables di production:
- `NODE_ENV=production`
- `JWT_SECRET` dengan secret yang kuat
- `CORS_ORIGIN` dengan domain yang spesifik
- `DATABASE_URL` dengan production database

## License

ISC
