import { FastifyInstance } from "fastify";
import {
  listAccountsHandler,
  getAccountHandler,
  createAccountHandler,
  updateAccountHandler,
} from "../controllers/account.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function accountRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // List accounts
  fastify.get(
    "/",
    {
      schema: {
        description: "List all accounts",
        tags: ["accounts"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["CASH", "BANK", "EWALLET", "INVESTMENT"],
            },
            archived: { type: "string", enum: ["true", "false"] },
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
                    name: { type: "string" },
                    type: { type: "string" },
                    currency: { type: "string" },
                    currentBalance: { type: "string" },
                    isArchived: { type: "boolean" },
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
    listAccountsHandler
  );

  // Get account detail
  fastify.get(
    "/:id",
    {
      schema: {
        description: "Get account detail",
        tags: ["accounts"],
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
              data: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string" },
                  currency: { type: "string" },
                  startingBalance: { type: "string" },
                  currentBalance: { type: "string" },
                  isArchived: { type: "boolean" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    getAccountHandler
  );

  // Create account
  fastify.post(
    "/",
    {
      schema: {
        description: "Create new account",
        tags: ["accounts"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "type"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            type: {
              type: "string",
              enum: ["CASH", "BANK", "EWALLET", "INVESTMENT"],
            },
            currency: { type: "string", minLength: 3, maxLength: 3, default: "IDR" },
            startingBalance: { type: "number", default: 0 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string" },
                  currency: { type: "string" },
                  startingBalance: { type: "string" },
                  currentBalance: { type: "string" },
                  isArchived: { type: "boolean" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    createAccountHandler
  );

  // Update account
  fastify.patch(
    "/:id",
    {
      schema: {
        description: "Update account",
        tags: ["accounts"],
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
            isArchived: { type: "boolean" },
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
                  id: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string" },
                  currency: { type: "string" },
                  startingBalance: { type: "string" },
                  currentBalance: { type: "string" },
                  isArchived: { type: "boolean" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    updateAccountHandler
  );
}
