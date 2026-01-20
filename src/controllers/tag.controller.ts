import { FastifyRequest, FastifyReply } from "fastify";
import { listTags, createTag, deleteTag } from "../services/tag.service.js";
import { createTagSchema } from "../validators/tag.js";
import { sendSuccess } from "../utils/response.js";

export async function listTagsHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;

  const tags = await listTags(userId);

  return sendSuccess(reply, tags, "OK");
}

export async function createTagHandler(
  request: FastifyRequest<{
    Body: {
      name: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const validatedData = createTagSchema.parse(request.body);

  const tag = await createTag(userId, validatedData);

  return sendSuccess(reply, tag, "Tag created successfully", 201);
}

export async function deleteTagHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  await deleteTag(id, userId);

  return sendSuccess(reply, null, "Tag deleted successfully");
}
