import { FastifyRequest, FastifyReply } from "fastify";
import {
  listRecurringRules,
  getRecurringRuleById,
  createRecurringRule,
  updateRecurringRule,
  toggleRecurringRule,
  runRecurringRule,
} from "../services/recurring.service.js";
import {
  createRecurringSchema,
  updateRecurringSchema,
  toggleRecurringSchema,
} from "../validators/recurring.js";
import { sendSuccess } from "../utils/response.js";
import { CategoryType, RecurringScheduleType } from "@prisma/client";

export async function listRecurringHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const rules = await listRecurringRules(userId);

  return sendSuccess(reply, rules, "OK");
}

export async function getRecurringHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const rule = await getRecurringRuleById(id, userId);

  return sendSuccess(reply, rule, "OK");
}

export async function createRecurringHandler(
  request: FastifyRequest<{
    Body: {
      name: string;
      type: CategoryType;
      amount: number;
      currency?: string;
      categoryId: string;
      accountId: string;
      scheduleType: RecurringScheduleType;
      scheduleValue: string;
      nextRunAt: string | Date;
      isActive?: boolean;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const validatedData = createRecurringSchema.parse(request.body);

  const rule = await createRecurringRule(userId, validatedData);

  return sendSuccess(reply, rule, "Recurring rule created successfully", 201);
}

export async function updateRecurringHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      name?: string;
      type?: CategoryType;
      amount?: number;
      currency?: string;
      categoryId?: string;
      accountId?: string;
      scheduleType?: RecurringScheduleType;
      scheduleValue?: string;
      nextRunAt?: string | Date;
      isActive?: boolean;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const validatedData = updateRecurringSchema.parse(request.body);

  const rule = await updateRecurringRule(id, userId, validatedData);

  return sendSuccess(reply, rule, "Recurring rule updated successfully");
}

export async function toggleRecurringHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      isActive: boolean;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const validatedData = toggleRecurringSchema.parse(request.body);

  const rule = await toggleRecurringRule(id, userId, validatedData);

  return sendSuccess(reply, rule, "Recurring rule toggled successfully");
}

export async function runRecurringHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const rule = await runRecurringRule(id, userId);

  return sendSuccess(reply, rule, "Recurring rule executed successfully");
}
