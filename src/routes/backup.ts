import { FastifyInstance } from "fastify";
import {
  exportBackupHandler,
  restoreBackupHandler,
} from "../controllers/backup.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import multipart from "@fastify/multipart";

export default async function backupRoutes(fastify: FastifyInstance) {
  // Register multipart plugin for file upload
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // Export backup (JSON)
  fastify.get(
    "/export.json",
    {
      schema: {
        description: "Export all user data as JSON backup",
        tags: ["backup"],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "string",
            description: "JSON backup file",
          },
        },
      },
    },
    exportBackupHandler
  );

  // Restore backup
  fastify.post(
    "/restore",
    {
      schema: {
        description: "Restore data from backup JSON file",
        tags: ["backup"],
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    restoreBackupHandler
  );
}
