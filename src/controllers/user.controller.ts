import { FastifyRequest, FastifyReply } from "fastify";
import { updateProfile, getCurrentUser } from "../services/user.service.js";
import { updateProfileSchema } from "../validators/user.js";
import { sendSuccess } from "../utils/response.js";

export async function getCurrentUserHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const user = await getCurrentUser(userId);

  return sendSuccess(reply, user, "OK");
}

export async function updateProfileHandler(
  request: FastifyRequest<{
    Body: {
      name?: string;
      defaultCurrency?: string;
      timezone?: string;
    };
  }>,
  reply: FastifyReply
) {
  // User already verified by requireAuth middleware
  const userId = request.user!.id;

  // Validate input
  const validatedData = updateProfileSchema.parse(request.body);

  // Update profile
  const user = await updateProfile(userId, validatedData);

  return sendSuccess(reply, user, "Profile updated successfully");
}
