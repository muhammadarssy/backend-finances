import { FastifyInstance } from "fastify";
import {
  getPortfolioSummaryHandler,
  listHoldingsHandler,
  getHoldingHandler,
  rebuildHoldingsHandler,
} from "../controllers/portfolio.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function portfolioRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // Portfolio summary
  fastify.get(
    "/portfolio/summary",
    {
      schema: {
        description: "Get portfolio summary with total value, P/L, and allocation",
        tags: ["invest-portfolio"],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  totalValue: { type: "string" },
                  unrealizedPL: { type: "string" },
                  realizedPL: { type: "string" },
                  allocation: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        assetType: { type: "string" },
                        value: { type: "string" },
                      },
                    },
                  },
                  totalCostBasis: { type: "string" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    getPortfolioSummaryHandler
  );

  // List holdings
  fastify.get(
    "/holdings",
    {
      schema: {
        description: "List all holdings",
        tags: ["invest-portfolio"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            assetType: {
              type: "string",
              enum: ["STOCK", "CRYPTO", "GOLD", "FUND", "OTHER"],
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "array",
                items: { type: "object" },
              },
            },
          },
        },
      },
    },
    listHoldingsHandler
  );

  // Get holding detail
  fastify.get(
    "/holdings/:assetId",
    {
      schema: {
        description: "Get holding detail for specific asset",
        tags: ["invest-portfolio"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["assetId"],
          properties: {
            assetId: { type: "string" },
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
    getHoldingHandler
  );

  // Rebuild holdings
  fastify.post(
    "/holdings/rebuild",
    {
      schema: {
        description: "Rebuild holdings from transactions (internal)",
        tags: ["invest-portfolio"],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  holdingsCreated: { type: "number" },
                  transactionsProcessed: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    rebuildHoldingsHandler
  );
}
