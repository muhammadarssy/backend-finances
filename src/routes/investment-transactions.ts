import { FastifyInstance } from "fastify";
import {
  listInvestmentTransactionsHandler,
  getInvestmentTransactionHandler,
  createInvestmentTransactionHandler,
  updateInvestmentTransactionHandler,
  deleteInvestmentTransactionHandler,
} from "../controllers/investment-transaction.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function investmentTransactionRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // List investment transactions
  fastify.get(
    "/",
    {
      schema: {
        description: "List all investment transactions with filters",
        tags: ["invest-transactions"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            assetId: { type: "string" },
            type: {
              type: "string",
              enum: ["BUY", "SELL", "DIVIDEND", "FEE", "DEPOSIT", "WITHDRAW"],
            },
            from: { type: "string", format: "date" },
            to: { type: "string", format: "date" },
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
    listInvestmentTransactionsHandler
  );

  // Get investment transaction detail
  fastify.get(
    "/:id",
    {
      schema: {
        description: "Get investment transaction detail",
        tags: ["invest-transactions"],
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
    getInvestmentTransactionHandler
  );

  // Create investment transaction
  fastify.post(
    "/",
    {
      schema: {
        description: "Create investment transaction (BUY/SELL/DIVIDEND/FEE/DEPOSIT/WITHDRAW)",
        tags: ["invest-transactions"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["assetId", "type", "occurredAt"],
          properties: {
            assetId: { type: "string" },
            type: {
              type: "string",
              enum: ["BUY", "SELL", "DIVIDEND", "FEE", "DEPOSIT", "WITHDRAW"],
            },
            units: { type: "number", minimum: 0.01 },
            pricePerUnit: { type: "number", minimum: 0.01 },
            grossAmount: { type: "number", minimum: 0.01 },
            feeAmount: { type: "number", minimum: 0, default: 0 },
            taxAmount: { type: "number", minimum: 0, default: 0 },
            netAmount: { type: "number", minimum: 0.01 },
            occurredAt: { type: "string", format: "date-time" },
            note: { type: "string", nullable: true },
            cashAccountId: { type: "string", nullable: true },
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
    createInvestmentTransactionHandler
  );

  // Update investment transaction
  fastify.patch(
    "/:id",
    {
      schema: {
        description: "Update investment transaction",
        tags: ["invest-transactions"],
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
            assetId: { type: "string" },
            type: {
              type: "string",
              enum: ["BUY", "SELL", "DIVIDEND", "FEE", "DEPOSIT", "WITHDRAW"],
            },
            units: { type: "number", minimum: 0.01, nullable: true },
            pricePerUnit: { type: "number", minimum: 0.01, nullable: true },
            grossAmount: { type: "number", minimum: 0.01, nullable: true },
            feeAmount: { type: "number", minimum: 0 },
            taxAmount: { type: "number", minimum: 0 },
            netAmount: { type: "number", minimum: 0.01 },
            occurredAt: { type: "string", format: "date-time" },
            note: { type: "string", nullable: true },
            cashAccountId: { type: "string", nullable: true },
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
    updateInvestmentTransactionHandler
  );

  // Delete investment transaction
  fastify.delete(
    "/:id",
    {
      schema: {
        description: "Delete investment transaction",
        tags: ["invest-transactions"],
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
    deleteInvestmentTransactionHandler
  );
}
