import { FastifyRequest, FastifyReply } from "fastify";
import {
  listPriceAlerts,
  createPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
} from "../services/price-alert.service.js";
import { sendSuccess } from "../utils/response.js";
import {
  createPriceAlertSchema,
  updatePriceAlertSchema,
} from "../validators/price-alert.js";
import { PriceAlertCondition } from "@prisma/client";

export async function listPriceAlertsHandler(
  request: FastifyRequest<{
    Querystring: {
      isActive?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const filters: { isActive?: boolean } = {};
  if (request.query.isActive !== undefined) {
    filters.isActive = request.query.isActive === "true";
  }

  const alerts = await listPriceAlerts(userId, filters);

  return sendSuccess(reply, alerts, "OK");
}

export async function createPriceAlertHandler(
  request: FastifyRequest<{
    Body: {
      assetId: string;
      condition: PriceAlertCondition;
      targetPrice: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { assetId, condition, targetPrice } = request.body;

  // Validate input
  createPriceAlertSchema.parse({ assetId, condition, targetPrice });

  const alert = await createPriceAlert(assetId, condition, targetPrice, userId);

  return sendSuccess(reply, alert, "Price alert created", 201);
}

export async function updatePriceAlertHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      isActive?: boolean;
      condition?: PriceAlertCondition;
      targetPrice?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;
  const updates = request.body;

  // Validate input
  updatePriceAlertSchema.parse(updates);

  const alert = await updatePriceAlert(id, userId, updates);

  return sendSuccess(reply, alert, "Price alert updated");
}

export async function deletePriceAlertHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  await deletePriceAlert(id, userId);

  return sendSuccess(reply, null, "Price alert deleted");
}
