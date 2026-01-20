import { FastifyInstance } from "fastify";
import {
  listDebtsHandler,
  getDebtHandler,
  createDebtHandler,
  updateDebtHandler,
  deleteDebtHandler,
  addDebtPaymentHandler,
  closeDebtHandler,
} from "../controllers/debt.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function debtRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // List debts
  fastify.get(
    "/debts",
    {
      schema: {
        description: "List all debts",
        tags: ["debts"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["DEBT", "RECEIVABLE"],
              description: "Filter by debt type",
            },
            status: {
              type: "string",
              enum: ["OPEN", "CLOSED"],
              description: "Filter by status",
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
    listDebtsHandler
  );

  // Get debt by ID
  fastify.get(
    "/debts/:id",
    {
      schema: {
        description: "Get debt by ID",
        tags: ["debts"],
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
    getDebtHandler
  );

  // Create debt
  fastify.post(
    "/debts",
    {
      schema: {
        description: "Create a new debt",
        tags: ["debts"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["type", "personName", "amountTotal", "amountRemaining"],
          properties: {
            type: {
              type: "string",
              enum: ["DEBT", "RECEIVABLE"],
            },
            personName: { type: "string" },
            amountTotal: { type: "string" },
            amountRemaining: { type: "string" },
            dueDate: { type: "string", format: "date-time", nullable: true },
            interestRate: { type: "string", nullable: true },
            minimumPayment: { type: "string", nullable: true },
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
    createDebtHandler
  );

  // Update debt
  fastify.put(
    "/debts/:id",
    {
      schema: {
        description: "Update debt",
        tags: ["debts"],
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
            personName: { type: "string" },
            amountTotal: { type: "string" },
            amountRemaining: { type: "string" },
            dueDate: { type: "string", format: "date-time", nullable: true },
            interestRate: { type: "string", nullable: true },
            minimumPayment: { type: "string", nullable: true },
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
    updateDebtHandler
  );

  // Delete debt
  fastify.delete(
    "/debts/:id",
    {
      schema: {
        description: "Delete debt (soft delete)",
        tags: ["debts"],
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
    deleteDebtHandler
  );

  // Add debt payment
  fastify.post(
    "/debts/:id/payments",
    {
      schema: {
        description: "Record a debt payment",
        tags: ["debts"],
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
          required: ["amountPaid"],
          properties: {
            amountPaid: { type: "string" },
            paidAt: { type: "string", format: "date-time" },
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
    addDebtPaymentHandler
  );

  // Close debt
  fastify.patch(
    "/debts/:id/close",
    {
      schema: {
        description: "Close a debt",
        tags: ["debts"],
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
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["CLOSED"],
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
    closeDebtHandler
  );
}
