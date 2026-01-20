import { FastifyInstance } from "fastify";
import {
  listPriceAlertsHandler,
  createPriceAlertHandler,
  updatePriceAlertHandler,
  deletePriceAlertHandler,
} from "../controllers/price-alert.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function priceAlertsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // List price alerts
  fastify.get(
    "/alerts",
    {
      schema: {
        description: "List all price alerts",
        tags: ["invest-alerts"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            isActive: {
              type: "string",
              enum: ["true", "false"],
              description: "Filter by active status",
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
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    userId: { type: "string" },
                    assetId: { type: "string" },
                    condition: { type: "string", enum: ["ABOVE", "BELOW"] },
                    targetPrice: { type: "number" },
                    isActive: { type: "boolean" },
                    triggeredAt: { type: "string", format: "date-time", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    asset: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
    listPriceAlertsHandler
  );

  // Create price alert
  fastify.post(
    "/alerts",
    {
      schema: {
        description: "Create a new price alert",
        tags: ["invest-alerts"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["assetId", "condition", "targetPrice"],
          properties: {
            assetId: { type: "string" },
            condition: {
              type: "string",
              enum: ["ABOVE", "BELOW"],
              description: "Alert when price goes ABOVE or BELOW target",
            },
            targetPrice: {
              type: "string",
              description: "Target price to trigger alert",
            },
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
    createPriceAlertHandler
  );

  // Update price alert
  fastify.patch(
    "/alerts/:id",
    {
      schema: {
        description: "Update price alert (enable/disable or modify)",
        tags: ["invest-alerts"],
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
            isActive: {
              type: "boolean",
              description: "Enable or disable the alert",
            },
            condition: {
              type: "string",
              enum: ["ABOVE", "BELOW"],
            },
            targetPrice: {
              type: "string",
              description: "New target price",
            },
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
    updatePriceAlertHandler
  );

  // Delete price alert
  fastify.delete(
    "/alerts/:id",
    {
      schema: {
        description: "Delete a price alert",
        tags: ["invest-alerts"],
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
    deletePriceAlertHandler
  );
}
