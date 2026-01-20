import { FastifyInstance } from "fastify";
import {
  listRecurringHandler,
  getRecurringHandler,
  createRecurringHandler,
  updateRecurringHandler,
  toggleRecurringHandler,
  runRecurringHandler,
} from "../controllers/recurring.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function recurringRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // List recurring rules
  fastify.get(
    "/",
    {
      schema: {
        description: "List all recurring rules",
        tags: ["recurring"],
        security: [{ bearerAuth: [] }],
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
    listRecurringHandler
  );

  // Get recurring rule detail
  fastify.get(
    "/:id",
    {
      schema: {
        description: "Get recurring rule detail",
        tags: ["recurring"],
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
    getRecurringHandler
  );

  // Create recurring rule
  fastify.post(
    "/",
    {
      schema: {
        description: "Create new recurring rule",
        tags: ["recurring"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: [
            "name",
            "type",
            "amount",
            "categoryId",
            "accountId",
            "scheduleType",
            "scheduleValue",
            "nextRunAt",
          ],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            type: { type: "string", enum: ["INCOME", "EXPENSE"] },
            amount: { type: "number", minimum: 0.01 },
            currency: { type: "string", minLength: 3, maxLength: 3, default: "IDR" },
            categoryId: { type: "string" },
            accountId: { type: "string" },
            scheduleType: {
              type: "string",
              enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
            },
            scheduleValue: { type: "string" },
            nextRunAt: { type: "string", format: "date-time" },
            isActive: { type: "boolean", default: true },
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
    createRecurringHandler
  );

  // Update recurring rule
  fastify.patch(
    "/:id",
    {
      schema: {
        description: "Update recurring rule",
        tags: ["recurring"],
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
            name: { type: "string", minLength: 1, maxLength: 255 },
            type: { type: "string", enum: ["INCOME", "EXPENSE"] },
            amount: { type: "number", minimum: 0.01 },
            currency: { type: "string", minLength: 3, maxLength: 3 },
            categoryId: { type: "string" },
            accountId: { type: "string" },
            scheduleType: {
              type: "string",
              enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
            },
            scheduleValue: { type: "string" },
            nextRunAt: { type: "string", format: "date-time" },
            isActive: { type: "boolean" },
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
    updateRecurringHandler
  );

  // Toggle recurring rule
  fastify.patch(
    "/:id/toggle",
    {
      schema: {
        description: "Enable or disable recurring rule",
        tags: ["recurring"],
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
          required: ["isActive"],
          properties: {
            isActive: { type: "boolean" },
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
    toggleRecurringHandler
  );

  // Run recurring rule manually
  fastify.post(
    "/:id/run",
    {
      schema: {
        description: "Run recurring rule manually (internal/admin)",
        tags: ["recurring"],
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
    runRecurringHandler
  );
}
