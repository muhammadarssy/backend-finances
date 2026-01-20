import { FastifyRequest, FastifyReply } from "fastify";
import { register, login, getMe } from "../services/auth.service.js";
import { registerSchema, loginSchema } from "../validators/auth.js";
import { sendSuccess } from "../utils/response.js";
import { requireAuth } from "../middlewares/auth.js";

export async function registerHandler(
  request: FastifyRequest<{
    Body: {
      name: string;
      email: string;
      password: string;
    };
  }>,
  reply: FastifyReply
) {
  // Validate input
  const validatedData = registerSchema.parse(request.body);

  // Register user
  const result = await register(validatedData);

  return sendSuccess(reply, result, "User registered successfully", 201);
}

export async function loginHandler(
  request: FastifyRequest<{
    Body: {
      email: string;
      password: string;
    };
  }>,
  reply: FastifyReply
) {
  // Validate input
  const validatedData = loginSchema.parse(request.body);

  // Login user
  const result = await login(validatedData);

  return sendSuccess(reply, result, "Login successful");
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  // User already verified by requireAuth middleware
  const userId = request.user!.id;

  // Get user data
  const user = await getMe(userId);

  return sendSuccess(reply, user, "OK");
}
