import prisma from "../config/database.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../utils/errors.js";
import {
  CreateTransactionInput,
  CreateTransferInput,
  UpdateTransactionInput,
} from "../validators/transaction.js";
import { TransactionType } from "@prisma/client";
import { serializeDecimal } from "../utils/serializer.js";

export async function listTransactions(
  userId: string,
  filters: {
    type?: TransactionType;
    accountId?: string;
    categoryId?: string;
    tagId?: string;
    from?: Date;
    to?: Date;
    q?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }
) {
  const where: any = {
    userId,
    isDeleted: false,
  };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.accountId) {
    where.accountId = filters.accountId;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.tagId) {
    where.tags = {
      some: {
        tagId: filters.tagId,
      },
    };
  }

  if (filters.from || filters.to) {
    where.occurredAt = {};
    if (filters.from) {
      where.occurredAt.gte = filters.from;
    }
    if (filters.to) {
      where.occurredAt.lte = filters.to;
    }
  }

  if (filters.q) {
    where.note = {
      contains: filters.q,
      mode: "insensitive",
    };
  }

  // Parse sort
  let orderBy: any = { occurredAt: "desc" };
  if (filters.sort) {
    const [field, direction] = filters.sort.split(":");
    orderBy = { [field]: direction || "desc" };
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions: serializeDecimal(transactions),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTransactionById(transactionId: string, userId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      account: true,
      category: true,
      fromAccount: true,
      toAccount: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new NotFoundError("Transaction not found");
  }

  if (transaction.userId !== userId) {
    throw new ForbiddenError("You don't have access to this transaction");
  }

  return serializeDecimal(transaction);
}

export async function createTransaction(userId: string, data: CreateTransactionInput) {
  // Validate transaction type
  if (data.type === TransactionType.INCOME || data.type === TransactionType.EXPENSE) {
    if (!data.accountId) {
      throw new ValidationError("accountId is required for INCOME/EXPENSE transactions");
    }

    // Verify account ownership
    const account = await prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      throw new NotFoundError("Account not found");
    }

    if (account.userId !== userId) {
      throw new ForbiddenError("You don't have access to this account");
    }

    // Verify category if provided
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new NotFoundError("Category not found");
      }

      if (category.userId !== userId) {
        throw new ForbiddenError("You don't have access to this category");
      }

      if (category.type !== data.type.toLowerCase()) {
        throw new ValidationError("Category type must match transaction type");
      }
    }
  }

  // Create transaction
  const transaction = await prisma.$transaction(async tx => {
    // Create transaction
    const newTransaction = await tx.transaction.create({
      data: {
        userId,
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        occurredAt: data.occurredAt,
        accountId: data.accountId || null,
        categoryId: data.categoryId || null,
        note: data.note,
        receiptUrl: data.receiptUrl,
        isDeleted: false,
      },
    });

    // Update account balance
    if (
      data.accountId &&
      (data.type === TransactionType.INCOME || data.type === TransactionType.EXPENSE)
    ) {
      const balanceChange = data.type === TransactionType.INCOME ? data.amount : -data.amount;

      await tx.account.update({
        where: { id: data.accountId },
        data: {
          currentBalance: {
            increment: balanceChange,
          },
        },
      });
    }

    // Link tags if provided
    if (data.tagIds && data.tagIds.length > 0) {
      // Verify all tags belong to user
      const tags = await tx.tag.findMany({
        where: {
          id: { in: data.tagIds },
          userId,
        },
      });

      if (tags.length !== data.tagIds.length) {
        throw new ValidationError("One or more tags not found or not accessible");
      }

      await tx.transactionTag.createMany({
        data: data.tagIds.map(tagId => ({
          transactionId: newTransaction.id,
          tagId,
        })),
      });
    }

    return newTransaction;
  });

  // Fetch with relations
  return getTransactionById(transaction.id, userId);
}

export async function createTransfer(userId: string, data: CreateTransferInput) {
  // Validate transfer
  if (data.fromAccountId === data.toAccountId) {
    throw new ValidationError("fromAccountId and toAccountId cannot be the same");
  }

  // Verify accounts
  const [fromAccount, toAccount] = await Promise.all([
    prisma.account.findUnique({ where: { id: data.fromAccountId } }),
    prisma.account.findUnique({ where: { id: data.toAccountId } }),
  ]);

  if (!fromAccount || !toAccount) {
    throw new NotFoundError("One or both accounts not found");
  }

  if (fromAccount.userId !== userId || toAccount.userId !== userId) {
    throw new ForbiddenError("You don't have access to one or both accounts");
  }

  // Create transfer transaction
  const transaction = await prisma.$transaction(async tx => {
    // Create transaction
    const newTransaction = await tx.transaction.create({
      data: {
        userId,
        type: TransactionType.TRANSFER,
        amount: data.amount,
        currency: data.currency,
        occurredAt: data.occurredAt,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        note: data.note,
        isDeleted: false,
      },
    });

    // Update balances
    await Promise.all([
      tx.account.update({
        where: { id: data.fromAccountId },
        data: {
          currentBalance: {
            decrement: data.amount,
          },
        },
      }),
      tx.account.update({
        where: { id: data.toAccountId },
        data: {
          currentBalance: {
            increment: data.amount,
          },
        },
      }),
    ]);

    return newTransaction;
  });

  // Fetch with relations
  return getTransactionById(transaction.id, userId);
}

export async function updateTransaction(
  transactionId: string,
  userId: string,
  data: UpdateTransactionInput
) {
  // Get existing transaction
  const existingTransaction = await getTransactionById(transactionId, userId);

  // Update transaction with balance adjustment
  const transaction = await prisma.$transaction(async tx => {
    // Reverse old balance changes
    if (existingTransaction.type === TransactionType.INCOME && existingTransaction.accountId) {
      await tx.account.update({
        where: { id: existingTransaction.accountId },
        data: {
          currentBalance: {
            decrement: existingTransaction.amount,
          },
        },
      });
    } else if (
      existingTransaction.type === TransactionType.EXPENSE &&
      existingTransaction.accountId
    ) {
      await tx.account.update({
        where: { id: existingTransaction.accountId },
        data: {
          currentBalance: {
            increment: existingTransaction.amount,
          },
        },
      });
    } else if (existingTransaction.type === TransactionType.TRANSFER) {
      if (existingTransaction.fromAccountId && existingTransaction.toAccountId) {
        await Promise.all([
          tx.account.update({
            where: { id: existingTransaction.fromAccountId },
            data: {
              currentBalance: {
                increment: existingTransaction.amount,
              },
            },
          }),
          tx.account.update({
            where: { id: existingTransaction.toAccountId },
            data: {
              currentBalance: {
                decrement: existingTransaction.amount,
              },
            },
          }),
        ]);
      }
    }

    // Apply new balance changes
    const newType = data.type || existingTransaction.type;
    const newAmount = data.amount || existingTransaction.amount;
    const newAccountId = data.accountId || existingTransaction.accountId;

    if (newType === TransactionType.INCOME && newAccountId) {
      await tx.account.update({
        where: { id: newAccountId },
        data: {
          currentBalance: {
            increment: newAmount,
          },
        },
      });
    } else if (newType === TransactionType.EXPENSE && newAccountId) {
      await tx.account.update({
        where: { id: newAccountId },
        data: {
          currentBalance: {
            decrement: newAmount,
          },
        },
      });
    } else if (newType === TransactionType.TRANSFER) {
      const newFromAccountId = data.fromAccountId || existingTransaction.fromAccountId;
      const newToAccountId = data.toAccountId || existingTransaction.toAccountId;

      if (newFromAccountId && newToAccountId) {
        await Promise.all([
          tx.account.update({
            where: { id: newFromAccountId },
            data: {
              currentBalance: {
                decrement: newAmount,
              },
            },
          }),
          tx.account.update({
            where: { id: newToAccountId },
            data: {
              currentBalance: {
                increment: newAmount,
              },
            },
          }),
        ]);
      }
    }

    // Update tags if provided
    if (data.tagIds !== undefined) {
      // Delete existing tags
      await tx.transactionTag.deleteMany({
        where: { transactionId: transactionId },
      });

      // Create new tags
      if (data.tagIds.length > 0) {
        const tags = await tx.tag.findMany({
          where: {
            id: { in: data.tagIds },
            userId,
          },
        });

        if (tags.length !== data.tagIds.length) {
          throw new ValidationError("One or more tags not found or not accessible");
        }

        await tx.transactionTag.createMany({
          data: data.tagIds.map(tagId => ({
            transactionId: transactionId,
            tagId,
          })),
        });
      }
    }

    // Update transaction
    const updatedTransaction = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.amount && { amount: data.amount }),
        ...(data.currency && { currency: data.currency }),
        ...(data.occurredAt && { occurredAt: data.occurredAt }),
        ...(data.accountId !== undefined && { accountId: data.accountId }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.receiptUrl !== undefined && { receiptUrl: data.receiptUrl }),
        ...(data.fromAccountId !== undefined && { fromAccountId: data.fromAccountId }),
        ...(data.toAccountId !== undefined && { toAccountId: data.toAccountId }),
      },
    });

    return updatedTransaction;
  });

  // Fetch with relations
  return getTransactionById(transaction.id, userId);
}

export async function deleteTransaction(transactionId: string, userId: string) {
  // Get existing transaction
  const existingTransaction = await getTransactionById(transactionId, userId);

  // Soft delete with balance reversal
  await prisma.$transaction(async tx => {
    // Reverse balance changes
    if (existingTransaction.type === TransactionType.INCOME && existingTransaction.accountId) {
      await tx.account.update({
        where: { id: existingTransaction.accountId },
        data: {
          currentBalance: {
            decrement: existingTransaction.amount,
          },
        },
      });
    } else if (
      existingTransaction.type === TransactionType.EXPENSE &&
      existingTransaction.accountId
    ) {
      await tx.account.update({
        where: { id: existingTransaction.accountId },
        data: {
          currentBalance: {
            increment: existingTransaction.amount,
          },
        },
      });
    } else if (existingTransaction.type === TransactionType.TRANSFER) {
      if (existingTransaction.fromAccountId && existingTransaction.toAccountId) {
        await Promise.all([
          tx.account.update({
            where: { id: existingTransaction.fromAccountId },
            data: {
              currentBalance: {
                increment: existingTransaction.amount,
              },
            },
          }),
          tx.account.update({
            where: { id: existingTransaction.toAccountId },
            data: {
              currentBalance: {
                decrement: existingTransaction.amount,
              },
            },
          }),
        ]);
      }
    }

    // Soft delete
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        isDeleted: true,
      },
    });
  });

  return { success: true };
}
