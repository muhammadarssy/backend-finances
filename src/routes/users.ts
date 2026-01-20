import { FastifyInstance } from "fastify";
import { updateProfileHandler, getCurrentUserHandler } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function userRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // Get current user
  fastify.get(
    "/me",
    {
      schema: {
        description: "Get current user profile",
        tags: ["users"],
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
    getCurrentUserHandler
  );

  // Update profile
  fastify.put(
    "/me",
    {
      schema: {
        description: "Update user profile",
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            defaultCurrency: { type: "string", minLength: 3, maxLength: 3 },
            timezone: { type: "string" },
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
    updateProfileHandler
  );
}
