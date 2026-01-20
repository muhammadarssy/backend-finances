import { FastifyInstance } from "fastify";
import {
  listInvestmentAssetsHandler,
  getInvestmentAssetHandler,
  createInvestmentAssetHandler,
  updateInvestmentAssetHandler,
} from "../controllers/investment-asset.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function investmentAssetRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // List investment assets
  fastify.get(
    "/",
    {
      schema: {
        description: "List all investment assets",
        tags: ["invest-assets"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            assetType: {
              type: "string",
              enum: ["STOCK", "CRYPTO", "GOLD", "FUND", "OTHER"],
            },
            q: { type: "string", description: "Search by symbol or name" },
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
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    symbol: { type: "string" },
                    name: { type: "string" },
                    assetType: { type: "string" },
                    exchange: { type: "string", nullable: true },
                    currency: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    listInvestmentAssetsHandler
  );

  // Get investment asset detail
  fastify.get(
    "/:id",
    {
      schema: {
        description: "Get investment asset detail",
        tags: ["invest-assets"],
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
    getInvestmentAssetHandler
  );

  // Create investment asset
  fastify.post(
    "/",
    {
      schema: {
        description: "Create new investment asset",
        tags: ["invest-assets"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["symbol", "name", "assetType"],
          properties: {
            symbol: { type: "string", minLength: 1, maxLength: 50 },
            name: { type: "string", minLength: 1, maxLength: 255 },
            assetType: {
              type: "string",
              enum: ["STOCK", "CRYPTO", "GOLD", "FUND", "OTHER"],
            },
            exchange: { type: "string", maxLength: 50, nullable: true },
            currency: { type: "string", minLength: 3, maxLength: 3, default: "IDR" },
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
    createInvestmentAssetHandler
  );

  // Update investment asset
  fastify.patch(
    "/:id",
    {
      schema: {
        description: "Update investment asset",
        tags: ["invest-assets"],
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
            symbol: { type: "string", minLength: 1, maxLength: 50 },
            name: { type: "string", minLength: 1, maxLength: 255 },
            assetType: {
              type: "string",
              enum: ["STOCK", "CRYPTO", "GOLD", "FUND", "OTHER"],
            },
            exchange: { type: "string", maxLength: 50, nullable: true },
            currency: { type: "string", minLength: 3, maxLength: 3 },
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
    updateInvestmentAssetHandler
  );
}
