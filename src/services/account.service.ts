import prisma from "../config/database.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../utils/errors.js";
import { CreateAccountInput, UpdateAccountInput } from "../validators/account.js";
import { AccountType } from "@prisma/client";

export async function listAccounts(
  userId: string,
  filters: {
    type?: AccountType;
    archived?: boolean;
  }
) {
  const where: any = {
    userId,
  };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.archived !== undefined) {
    where.isArchived = filters.archived;
  }

  const accounts = await prisma.account.findMany({
    where,
    select: {
      id: true,
      name: true,
      type: true,
      currency: true,
      currentBalance: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return accounts;
}

export async function getAccountById(accountId: string, userId: string) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new NotFoundError("Account not found");
  }

  if (account.userId !== userId) {
    throw new ForbiddenError("You don't have access to this account");
  }

  return account;
}

export async function createAccount(userId: string, data: CreateAccountInput) {
  const account = await prisma.account.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      currency: data.currency,
      startingBalance: data.startingBalance,
      currentBalance: data.startingBalance,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      type: true,
      currency: true,
      startingBalance: true,
      currentBalance: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return account;
}

export async function updateAccount(accountId: string, userId: string, data: UpdateAccountInput) {
  // Verify ownership
  await getAccountById(accountId, userId);

  const account = await prisma.account.update({
    where: { id: accountId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
    },
    select: {
      id: true,
      name: true,
      type: true,
      currency: true,
      startingBalance: true,
      currentBalance: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return account;
}
