import { FastifyInstance } from "fastify";
import {
  getBudgetHandler,
  upsertBudgetHandler,
  deleteBudgetHandler,
} from "../controllers/budget.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function budgetRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // Get budget by month
  fastify.get(
    "/current",
    {
      schema: {
        description: "Get budget for current or specified month",
        tags: ["budgets"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            month: { type: "number", minimum: 1, maximum: 12 },
            year: { type: "number", minimum: 2000, maximum: 3000 },
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
                  id: { type: "string", nullable: true },
                  month: { type: "number" },
                  year: { type: "number" },
                  totalLimit: { type: "number", nullable: true },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        categoryId: { type: "string" },
                        limitAmount: { type: "number" },
                        spent: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    getBudgetHandler
  );

  // Upsert budget
  fastify.put(
    "/",
    {
      schema: {
        description: "Create or update budget for a month",
        tags: ["budgets"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["month", "year", "items"],
          properties: {
            month: { type: "number", minimum: 1, maximum: 12 },
            year: { type: "number", minimum: 2000, maximum: 3000 },
            totalLimit: { type: "number", nullable: true },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["categoryId", "limitAmount"],
                properties: {
                  categoryId: { type: "string" },
                  limitAmount: { type: "number", minimum: 0.01 },
                },
              },
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
    upsertBudgetHandler
  );

  // Delete budget
  fastify.delete(
    "/:id",
    {
      schema: {
        description: "Delete budget",
        tags: ["budgets"],
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
    deleteBudgetHandler
  );
}
