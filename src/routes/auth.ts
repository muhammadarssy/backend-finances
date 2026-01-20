import { FastifyInstance } from "fastify";
import { registerHandler, loginHandler, meHandler } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post(
    "/register",
    {
      schema: {
        description: "Register new user",
        tags: ["auth"],
        body: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
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
                  token: { type: "string" },
                  user: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      email: { type: "string" },
                      defaultCurrency: { type: "string" },
                      timezone: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    registerHandler
  );

  // Login
  fastify.post(
    "/login",
    {
      schema: {
        description: "Login user",
        tags: ["auth"],
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
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
                  token: { type: "string" },
                  user: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      email: { type: "string" },
                      defaultCurrency: { type: "string" },
                      timezone: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    loginHandler
  );

  // Get current user (Me)
  fastify.get(
    "/me",
    {
      preHandler: [requireAuth],
      schema: {
        description: "Get current user profile",
        tags: ["auth"],
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
                  id: { type: "string" },
                  name: { type: "string" },
                  email: { type: "string" },
                  defaultCurrency: { type: "string" },
                  timezone: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    meHandler
  );
}
