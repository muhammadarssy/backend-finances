import { FastifyInstance } from "fastify";
import {
  listCategoriesHandler,
  getCategoryHandler,
  createCategoryHandler,
  updateCategoryHandler,
  archiveCategoryHandler,
} from "../controllers/category.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function categoryRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // List categories
  fastify.get(
    "/",
    {
      schema: {
        description: "List all categories",
        tags: ["categories"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["INCOME", "EXPENSE"] },
            includeChildren: { type: "string", enum: ["true", "false"] },
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
                    icon: { type: "string", nullable: true },
                    color: { type: "string", nullable: true },
                    parentId: { type: "string", nullable: true },
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
    listCategoriesHandler
  );

  // Get category detail
  fastify.get(
    "/:id",
    {
      schema: {
        description: "Get category detail",
        tags: ["categories"],
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
    getCategoryHandler
  );

  // Create category
  fastify.post(
    "/",
    {
      schema: {
        description: "Create new category",
        tags: ["categories"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "type"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            type: { type: "string", enum: ["INCOME", "EXPENSE"] },
            icon: { type: "string" },
            color: { type: "string" },
            parentId: { type: "string", nullable: true },
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
    createCategoryHandler
  );

  // Update category
  fastify.patch(
    "/:id",
    {
      schema: {
        description: "Update category",
        tags: ["categories"],
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
            icon: { type: "string" },
            color: { type: "string" },
            parentId: { type: "string", nullable: true },
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
    updateCategoryHandler
  );

  // Archive category
  fastify.patch(
    "/:id/archive",
    {
      schema: {
        description: "Archive or unarchive category",
        tags: ["categories"],
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
          required: ["isArchived"],
          properties: {
            isArchived: { type: "boolean" },
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
    archiveCategoryHandler
  );
}
