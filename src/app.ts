import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { env } from "./config/env.js";
import { errorHandler } from "./utils/errors.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import accountRoutes from "./routes/accounts.js";
import categoryRoutes from "./routes/categories.js";
import tagRoutes from "./routes/tags.js";
import transactionRoutes from "./routes/transactions.js";
import budgetRoutes from "./routes/budgets.js";
import billRoutes from "./routes/bills.js";
import recurringRoutes from "./routes/recurring.js";
import investmentAssetRoutes from "./routes/investment-assets.js";
import investmentTransactionRoutes from "./routes/investment-transactions.js";
import portfolioRoutes from "./routes/portfolio.js";
import watchlistRoutes from "./routes/watchlist.js";
import priceAlertsRoutes from "./routes/price-alerts.js";
import reportsRoutes from "./routes/reports.js";
import exportRoutes from "./routes/export.js";
import backupRoutes from "./routes/backup.js";
import debtRoutes from "./routes/debts.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: {
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
              },
            }
          : undefined,
    },
  });

  // Register CORS - Allow all origins in development for Swagger UI
  await app.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or Swagger UI)
      if (!origin) {
        return callback(null, true);
      }

      // In development, allow all origins (including Swagger UI)
      if (env.NODE_ENV === "development") {
        return callback(null, true);
      }

      // In production, check against allowed origins
      const allowedOrigins = env.CORS_ORIGIN.split(",").map(o => o.trim());
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  // Register Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Register Swagger
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Finance & Investment API",
        description: "API untuk Personal Finance dan Investment Management",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://${env.HOST}:${env.PORT}`,
          description: "Development server",
        },
      ],
      tags: [
        { name: "auth", description: "Authentication endpoints" },
        { name: "users", description: "User management endpoints" },
        { name: "accounts", description: "Account/Wallet management" },
        { name: "categories", description: "Category management" },
        { name: "tags", description: "Tag management" },
        { name: "transactions", description: "Finance transactions" },
        { name: "budgets", description: "Budget management" },
        { name: "bills", description: "Bill management" },
        { name: "recurring", description: "Recurring transactions" },
        { name: "invest-assets", description: "Investment assets" },
        { name: "invest-transactions", description: "Investment transactions" },
        { name: "invest-portfolio", description: "Portfolio & holdings" },
        { name: "invest-watchlist", description: "Watchlist management" },
        { name: "invest-alerts", description: "Price alerts" },
        { name: "reports", description: "Reports & analytics" },
        { name: "export", description: "Export & backup" },
        { name: "debts", description: "Debt management" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  // Register Swagger UI
  await app.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: header => header,
  });

  // Health check endpoint
  app.get(
    "/health",
    {
      schema: {
        description: "Health check endpoint",
        tags: ["health"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      return reply.send({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    }
  );

  // Set error handler
  app.setErrorHandler(errorHandler);

  // Register routes
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(userRoutes, { prefix: "/api/v1/users" });
  await app.register(accountRoutes, { prefix: "/api/v1/accounts" });
  await app.register(categoryRoutes, { prefix: "/api/v1/categories" });
  await app.register(tagRoutes, { prefix: "/api/v1/tags" });
  await app.register(transactionRoutes, { prefix: "/api/v1/transactions" });
  await app.register(budgetRoutes, { prefix: "/api/v1/budgets" });
  await app.register(billRoutes, { prefix: "/api/v1/bills" });
  await app.register(recurringRoutes, { prefix: "/api/v1/recurring" });
  await app.register(investmentAssetRoutes, { prefix: "/api/v1/invest/assets" });
  await app.register(investmentTransactionRoutes, { prefix: "/api/v1/invest/transactions" });
  await app.register(portfolioRoutes, { prefix: "/api/v1/invest" });
  await app.register(watchlistRoutes, { prefix: "/api/v1/invest" });
  await app.register(priceAlertsRoutes, { prefix: "/api/v1/invest" });
  await app.register(reportsRoutes, { prefix: "/api/v1/reports" });
  await app.register(exportRoutes, { prefix: "/api/v1/export" });
  await app.register(backupRoutes, { prefix: "/api/v1/backup" });
  await app.register(debtRoutes, { prefix: "/api/v1" });
  // ... other routes will be added in later phases

  return app;
}
