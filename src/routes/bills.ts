import { FastifyInstance } from "fastify";
import {
  listBillsHandler,
  getBillHandler,
  createBillHandler,
  updateBillHandler,
  payBillHandler,
  deleteBillHandler,
} from "../controllers/bill.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function billRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // List bills
  fastify.get(
    "/",
    {
      schema: {
        description: "List all bills with filters",
        tags: ["bills"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["PAID", "UNPAID"] },
            from: { type: "string", format: "date" },
            to: { type: "string", format: "date" },
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
    listBillsHandler
  );

  // Get bill detail
  fastify.get(
    "/:id",
    {
      schema: {
        description: "Get bill detail",
        tags: ["bills"],
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
    getBillHandler
  );

  // Create bill
  fastify.post(
    "/",
    {
      schema: {
        description: "Create new bill",
        tags: ["bills"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "amount", "categoryId", "accountId", "dueDate"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            amount: { type: "number", minimum: 0.01 },
            currency: { type: "string", minLength: 3, maxLength: 3, default: "IDR" },
            categoryId: { type: "string" },
            accountId: { type: "string" },
            dueDate: { type: "string", format: "date-time" },
            reminderDays: {
              type: "array",
              items: { type: "number", minimum: 0, maximum: 30 },
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
    createBillHandler
  );

  // Update bill
  fastify.patch(
    "/:id",
    {
      schema: {
        description: "Update bill",
        tags: ["bills"],
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
            amount: { type: "number", minimum: 0.01 },
            currency: { type: "string", minLength: 3, maxLength: 3 },
            categoryId: { type: "string" },
            accountId: { type: "string" },
            dueDate: { type: "string", format: "date-time" },
            reminderDays: {
              type: "array",
              items: { type: "number", minimum: 0, maximum: 30 },
              nullable: true,
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
    updateBillHandler
  );

  // Pay bill
  fastify.post(
    "/:id/pay",
    {
      schema: {
        description: "Mark bill as paid and record payment",
        tags: ["bills"],
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
          required: ["paidAt", "amountPaid"],
          properties: {
            paidAt: { type: "string", format: "date-time" },
            amountPaid: { type: "number", minimum: 0.01 },
            transactionId: { type: "string", nullable: true },
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
    payBillHandler
  );

  // Delete bill
  fastify.delete(
    "/:id",
    {
      schema: {
        description: "Delete bill",
        tags: ["bills"],
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
    deleteBillHandler
  );
}
