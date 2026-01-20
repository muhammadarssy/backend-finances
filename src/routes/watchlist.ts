import { FastifyInstance } from "fastify";
import {
  listWatchlistHandler,
  addToWatchlistHandler,
  removeFromWatchlistHandler,
} from "../controllers/watchlist.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function watchlistRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // List watchlist
  fastify.get(
    "/watchlist",
    {
      schema: {
        description: "List all assets in watchlist",
        tags: ["invest-watchlist"],
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
                    userId: { type: "string" },
                    assetId: { type: "string" },
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
    listWatchlistHandler
  );

  // Add to watchlist
  fastify.post(
    "/watchlist",
    {
      schema: {
        description: "Add asset to watchlist",
        tags: ["invest-watchlist"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["assetId"],
          properties: {
            assetId: { type: "string" },
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
    addToWatchlistHandler
  );

  // Remove from watchlist
  fastify.delete(
    "/watchlist/:id",
    {
      schema: {
        description: "Remove asset from watchlist",
        tags: ["invest-watchlist"],
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
    removeFromWatchlistHandler
  );
}
