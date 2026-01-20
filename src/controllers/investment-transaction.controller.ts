import { FastifyRequest, FastifyReply } from "fastify";
import {
  listInvestmentTransactions,
  getInvestmentTransactionById,
  createInvestmentTransaction,
  updateInvestmentTransaction,
  deleteInvestmentTransaction,
} from "../services/investment-transaction.service.js";
import {
  createInvestmentTransactionSchema,
  updateInvestmentTransactionSchema,
} from "../validators/investment-transaction.js";
import { sendSuccess } from "../utils/response.js";
import { InvestmentTransactionType } from "@prisma/client";

export async function listInvestmentTransactionsHandler(
  request: FastifyRequest<{
    Querystring: {
      assetId?: string;
      type?: InvestmentTransactionType;
      from?: string;
      to?: string;
      page?: string;
      limit?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const filters = {
    assetId: request.query.assetId,
    type: request.query.type,
    from: request.query.from ? new Date(request.query.from) : undefined,
    to: request.query.to ? new Date(request.query.to) : undefined,
    page: request.query.page ? parseInt(request.query.page, 10) : undefined,
    limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
  };

  const result = await listInvestmentTransactions(userId, filters);

  return sendSuccess(reply, result, "OK");
}

export async function getInvestmentTransactionHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const transaction = await getInvestmentTransactionById(id, userId);

  return sendSuccess(reply, transaction, "OK");
}

export async function createInvestmentTransactionHandler(
  request: FastifyRequest<{
    Body: {
      assetId: string;
      type: InvestmentTransactionType;
      units?: number;
      pricePerUnit?: number;
      grossAmount?: number;
      feeAmount?: number;
      taxAmount?: number;
      netAmount?: number;
      occurredAt: string | Date;
      note?: string | null;
      cashAccountId?: string | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const validatedData = createInvestmentTransactionSchema.parse(request.body);

  const transaction = await createInvestmentTransaction(userId, validatedData);

  return sendSuccess(reply, transaction, "Investment transaction created successfully", 201);
}

export async function updateInvestmentTransactionHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      assetId?: string;
      type?: InvestmentTransactionType;
      units?: number | null;
      pricePerUnit?: number | null;
      grossAmount?: number | null;
      feeAmount?: number;
      taxAmount?: number;
      netAmount?: number;
      occurredAt?: string | Date;
      note?: string | null;
      cashAccountId?: string | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const validatedData = updateInvestmentTransactionSchema.parse(request.body);

  const transaction = await updateInvestmentTransaction(id, userId, validatedData);

  return sendSuccess(reply, transaction, "Investment transaction updated successfully");
}

export async function deleteInvestmentTransactionHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  await deleteInvestmentTransaction(id, userId);

  return sendSuccess(reply, null, "Investment transaction deleted successfully");
}
