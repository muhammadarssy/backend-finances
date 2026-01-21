import { FastifyRequest, FastifyReply } from "fastify";
import {
  getBudgetByMonth,
  getBudgetById,
  upsertBudget,
  deleteBudget,
} from "../services/budget.service.js";
import { upsertBudgetSchema } from "../validators/budget.js";
import { sendSuccess } from "../utils/response.js";

export async function getBudgetHandler(
  request: FastifyRequest<{
    Querystring: {
      month?: string;
      year?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const month = request.query.month ? parseInt(request.query.month, 10) : undefined;
  const year = request.query.year ? parseInt(request.query.year, 10) : undefined;

  const budget = await getBudgetByMonth(userId, month, year);

  return sendSuccess(reply, budget, "OK");
}

export async function getBudgetByIdHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const budget = await getBudgetById(id, userId);

  return sendSuccess(reply, budget, "OK");
}

export async function upsertBudgetHandler(
  request: FastifyRequest<{
    Body: {
      month: number;
      year: number;
      totalLimit?: number | null;
      items: Array<{
        categoryId: string;
        limitAmount: number;
      }>;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const validatedData = upsertBudgetSchema.parse(request.body);

  const budget = await upsertBudget(userId, validatedData);

  return sendSuccess(reply, budget, "Budget saved successfully");
}

export async function deleteBudgetHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  await deleteBudget(id, userId);

  return sendSuccess(reply, null, "Budget deleted successfully");
}
