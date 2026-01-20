import { FastifyInstance } from "fastify";
import {
  listTransactionsHandler,
  getTransactionHandler,
  createTransactionHandler,
  createTransferHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
} from "../controllers/transaction.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function transactionRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // List transactions
  fastify.get(
    "/",
    {
      schema: {
        description: "List all transactions with filters",
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["INCOME", "EXPENSE", "TRANSFER"] },
            accountId: { type: "string" },
            categoryId: { type: "string" },
            tagId: { type: "string" },
            from: { type: "string", format: "date" },
            to: { type: "string", format: "date" },
            q: { type: "string" },
            sort: { type: "string", default: "occurredAt:desc" },
            page: { type: "number", minimum: 1, default: 1 },
            limit: { type: "number", minimum: 1, maximum: 100, default: 20 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  transactions: {
                    type: "array",
                    items: { type: "object" },
                  },
                  pagination: {
                    type: "object",
                    properties: {
                      page: { type: "number" },
                      limit: { type: "number" },
                      total: { type: "number" },
                      totalPages: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    listTransactionsHandler
  );

  // Get transaction detail
  fastify.get(
    "/:id",
    {
      schema: {
        description: "Get transaction detail",
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    getTransactionHandler
  );

  // Create transaction (income/expense)
  fastify.post(
    "/",
    {
      schema: {
        description: "Create income or expense transaction",
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["type", "amount", "occurredAt", "accountId"],
          properties: {
            type: { type: "string", enum: ["INCOME", "EXPENSE"] },
            amount: { type: "number", minimum: 0.01 },
            currency: { type: "string", minLength: 3, maxLength: 3, default: "IDR" },
            occurredAt: { type: "string", format: "date-time" },
            accountId: { type: "string" },
            categoryId: { type: "string" },
            note: { type: "string" },
            tagIds: {
              type: "array",
              items: { type: "string" },
            },
            receiptUrl: { type: "string", format: "uri", nullable: true },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    createTransactionHandler
  );

  // Create transfer
  fastify.post(
    "/transfer",
    {
      schema: {
        description: "Create transfer transaction",
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["amount", "occurredAt", "fromAccountId", "toAccountId"],
          properties: {
            amount: { type: "number", minimum: 0.01 },
            currency: { type: "string", minLength: 3, maxLength: 3, default: "IDR" },
            occurredAt: { type: "string", format: "date-time" },
            fromAccountId: { type: "string" },
            toAccountId: { type: "string" },
            note: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    createTransferHandler
  );

  // Update transaction
  fastify.patch(
    "/:id",
    {
      schema: {
        description: "Update transaction",
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["INCOME", "EXPENSE", "TRANSFER"] },
            amount: { type: "number", minimum: 0.01 },
            currency: { type: "string", minLength: 3, maxLength: 3 },
            occurredAt: { type: "string", format: "date-time" },
            accountId: { type: "string" },
            categoryId: { type: "string", nullable: true },
            note: { type: "string", nullable: true },
            tagIds: {
              type: "array",
              items: { type: "string" },
            },
            receiptUrl: { type: "string", format: "uri", nullable: true },
            fromAccountId: { type: "string", nullable: true },
            toAccountId: { type: "string", nullable: true },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    updateTransactionHandler
  );

  // Delete transaction (soft delete)
  fastify.delete(
    "/:id",
    {
      schema: {
        description: "Delete transaction (soft delete)",
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: { type: "null" },
            },
          },
        },
      },
    },
    deleteTransactionHandler
  );
}
