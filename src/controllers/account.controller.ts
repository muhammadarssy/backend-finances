import { FastifyRequest, FastifyReply } from "fastify";
import {
  listAccounts,
  getAccountById,
  createAccount,
  updateAccount,
} from "../services/account.service.js";
import { createAccountSchema, updateAccountSchema } from "../validators/account.js";
import { sendSuccess } from "../utils/response.js";
import { AccountType } from "@prisma/client";

export async function listAccountsHandler(
  request: FastifyRequest<{
    Querystring: {
      type?: AccountType;
      archived?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const filters = {
    type: request.query.type,
    archived:
      request.query.archived === "true"
        ? true
        : request.query.archived === "false"
          ? false
          : undefined,
  };

  const accounts = await listAccounts(userId, filters);

  return sendSuccess(reply, accounts, "OK");
}

export async function getAccountHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const account = await getAccountById(id, userId);

  return sendSuccess(reply, account, "OK");
}

export async function createAccountHandler(
  request: FastifyRequest<{
    Body: {
      name: string;
      type: AccountType;
      currency?: string;
      startingBalance?: number;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const validatedData = createAccountSchema.parse(request.body);

  const account = await createAccount(userId, validatedData);

  return sendSuccess(reply, account, "Account created successfully", 201);
}

export async function updateAccountHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      name?: string;
      isArchived?: boolean;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const validatedData = updateAccountSchema.parse(request.body);

  const account = await updateAccount(id, userId, validatedData);

  return sendSuccess(reply, account, "Account updated successfully");
}
