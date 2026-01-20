import { FastifyInstance } from "fastify";
import {
  listTagsHandler,
  createTagHandler,
  deleteTagHandler,
} from "../controllers/tag.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function tagRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // List tags
  fastify.get(
    "/",
    {
      schema: {
        description: "List all tags",
        tags: ["tags"],
        security: [{ bearerAuth: [] }],
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
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    listTagsHandler
  );

  // Create tag
  fastify.post(
    "/",
    {
      schema: {
        description: "Create new tag",
        tags: ["tags"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
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
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    createTagHandler
  );

  // Delete tag
  fastify.delete(
    "/:id",
    {
      schema: {
        description: "Delete tag",
        tags: ["tags"],
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
    deleteTagHandler
  );
}
