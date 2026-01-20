import { FastifyInstance } from "fastify";
import {
  exportFinanceTransactionsHandler,
  exportInvestmentTransactionsHandler,
} from "../controllers/export.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function exportRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // Export finance transactions to CSV
  fastify.get(
    "/transactions.csv",
    {
      schema: {
        description: "Export finance transactions to CSV",
        tags: ["export"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            from: {
              type: "string",
              description: "Start date (YYYY-MM-DD)",
            },
            to: {
              type: "string",
              description: "End date (YYYY-MM-DD)",
            },
          },
        },
        response: {
          200: {
            type: "string",
            description: "CSV file",
          },
        },
      },
    },
    exportFinanceTransactionsHandler
  );

  // Export investment transactions to CSV
  fastify.get(
    "/invest-transactions.csv",
    {
      schema: {
        description: "Export investment transactions to CSV",
        tags: ["export"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            from: {
              type: "string",
              description: "Start date (YYYY-MM-DD)",
            },
            to: {
              type: "string",
              description: "End date (YYYY-MM-DD)",
            },
          },
        },
        response: {
          200: {
            type: "string",
            description: "CSV file",
          },
        },
      },
    },
    exportInvestmentTransactionsHandler
  );
}
