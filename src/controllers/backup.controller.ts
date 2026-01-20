import { FastifyRequest, FastifyReply } from "fastify";
import { exportAllDataToJSON, restoreFromBackup } from "../services/backup.service.js";
import { sendSuccess } from "../utils/response.js";
import { ValidationError } from "../utils/errors.js";

export async function exportBackupHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const json = await exportAllDataToJSON(userId);

  reply.header("Content-Type", "application/json");
  reply.header("Content-Disposition", `attachment; filename="backup-${new Date().toISOString().split("T")[0]}.json"`);

  return reply.send(json);
}

export async function restoreBackupHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const data = await request.file();

  if (!data) {
    throw new ValidationError("No file uploaded");
  }

  // Read file content
  const buffer = await data.toBuffer();
  const content = buffer.toString("utf-8");

  // Parse JSON
  let backupData;
  try {
    backupData = JSON.parse(content);
  } catch (error) {
    throw new ValidationError("Invalid JSON file");
  }

  // Restore backup
  const result = await restoreFromBackup(userId, backupData);

  return sendSuccess(reply, result, "Backup restored successfully");
}
