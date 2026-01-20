import { FastifyRequest, FastifyReply } from "fastify";
import {
  listTransactions,
  getTransactionById,
  createTransaction,
  createTransfer,
  updateTransaction,
  deleteTransaction,
} from "../services/transaction.service.js";
import {
  createTransactionSchema,
  createTransferSchema,
  updateTransactionSchema,
} from "../validators/transaction.js";
import { sendSuccess } from "../utils/response.js";
import { TransactionType } from "@prisma/client";

export async function listTransactionsHandler(
  request: FastifyRequest<{
    Querystring: {
      type?: TransactionType;
      accountId?: string;
      categoryId?: string;
      tagId?: string;
      from?: string;
      to?: string;
      q?: string;
      sort?: string;
      page?: string;
      limit?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const filters = {
    type: request.query.type,
    accountId: request.query.accountId,
    categoryId: request.query.categoryId,
    tagId: request.query.tagId,
    from: request.query.from ? new Date(request.query.from) : undefined,
    to: request.query.to ? new Date(request.query.to) : undefined,
    q: request.query.q,
    sort: request.query.sort,
    page: request.query.page ? parseInt(request.query.page, 10) : undefined,
    limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
  };

  const result = await listTransactions(userId, filters);

  return sendSuccess(reply, result, "OK");
}

export async function getTransactionHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const transaction = await getTransactionById(id, userId);

  return sendSuccess(reply, transaction, "OK");
}

export async function createTransactionHandler(
  request: FastifyRequest<{
    Body: {
      type: TransactionType;
      amount: number;
      currency?: string;
      occurredAt: string | Date;
      accountId?: string;
      categoryId?: string;
      note?: string;
      tagIds?: string[];
      receiptUrl?: string | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const validatedData = createTransactionSchema.parse(request.body);

  const transaction = await createTransaction(userId, validatedData);

  return sendSuccess(reply, transaction, "Transaction created successfully", 201);
}

export async function createTransferHandler(
  request: FastifyRequest<{
    Body: {
      amount: number;
      currency?: string;
      occurredAt: string | Date;
      fromAccountId: string;
      toAccountId: string;
      note?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const validatedData = createTransferSchema.parse(request.body);

  const transaction = await createTransfer(userId, validatedData);

  return sendSuccess(reply, transaction, "Transfer created successfully", 201);
}

export async function updateTransactionHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      type?: TransactionType;
      amount?: number;
      currency?: string;
      occurredAt?: string | Date;
      accountId?: string;
      categoryId?: string | null;
      note?: string | null;
      tagIds?: string[];
      receiptUrl?: string | null;
      fromAccountId?: string | null;
      toAccountId?: string | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const validatedData = updateTransactionSchema.parse(request.body);

  const transaction = await updateTransaction(id, userId, validatedData);

  return sendSuccess(reply, transaction, "Transaction updated successfully");
}

export async function deleteTransactionHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  await deleteTransaction(id, userId);

  return sendSuccess(reply, null, "Transaction deleted successfully");
}
