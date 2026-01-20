import prisma from "../config/database.js";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../utils/errors.js";
import {
  CreateInvestmentTransactionInput,
  UpdateInvestmentTransactionInput,
} from "../validators/investment-transaction.js";
import { InvestmentTransactionType } from "@prisma/client";

export async function listInvestmentTransactions(
  userId: string,
  filters: {
    assetId?: string;
    type?: InvestmentTransactionType;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }
) {
  const where: any = {
    userId,
  };

  if (filters.assetId) {
    where.assetId = filters.assetId;
  }

  if (filters.type) {
    where.type = filters.type;
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

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.investmentTransaction.findMany({
      where,
      include: {
        asset: true,
        cashAccount: true,
      },
      orderBy: {
        occurredAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.investmentTransaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getInvestmentTransactionById(
  transactionId: string,
  userId: string
) {
  const transaction = await prisma.investmentTransaction.findUnique({
    where: { id: transactionId },
    include: {
      asset: true,
      cashAccount: true,
    },
  });

  if (!transaction) {
    throw new NotFoundError("Investment transaction not found");
  }

  if (transaction.userId !== userId) {
    throw new ForbiddenError(
      "You don't have access to this investment transaction"
    );
  }

  return transaction;
}

function calculateNetAmount(
  type: InvestmentTransactionType,
  data: {
    units?: number | null;
    pricePerUnit?: number | null;
    grossAmount?: number | null;
    feeAmount?: number;
    taxAmount?: number;
    netAmount?: number | null;
  }
): number {
  // If netAmount already provided, use it
  if (data.netAmount !== undefined && data.netAmount !== null) {
    return data.netAmount;
  }

  // Calculate based on type
  if (type === "BUY" || type === "SELL") {
    if (!data.units || !data.pricePerUnit) {
      throw new ValidationError("units and pricePerUnit are required for BUY/SELL");
    }

    const gross = data.grossAmount || Number(data.units) * Number(data.pricePerUnit);
    const fee = Number(data.feeAmount || 0);
    const tax = Number(data.taxAmount || 0);
    const net = gross - fee - tax;

    if (net <= 0) {
      throw new ValidationError("netAmount must be greater than 0");
    }

    return net;
  }

  // For DIVIDEND, FEE, DEPOSIT, WITHDRAW
  if (data.netAmount === undefined || data.netAmount === null) {
    throw new ValidationError("netAmount is required for this transaction type");
  }

  return data.netAmount;
}

async function updateHolding(
  tx: any,
  userId: string,
  assetId: string,
  type: InvestmentTransactionType,
  units: number,
  pricePerUnit: number
) {
  // Get or create holding
  let holding = await tx.holding.findUnique({
    where: {
      userId_assetId: {
        userId,
        assetId,
      },
    },
  });

  if (type === "BUY") {
    if (!holding) {
      // Create new holding
      await tx.holding.create({
        data: {
          userId,
          assetId,
          unitsTotal: units,
          avgBuyPrice: pricePerUnit,
        },
      });
    } else {
      // Update existing holding - calculate weighted average
      const currentValue = Number(holding.unitsTotal) * Number(holding.avgBuyPrice);
      const newValue = units * pricePerUnit;
      const totalUnits = Number(holding.unitsTotal) + units;
      const newAvgPrice = (currentValue + newValue) / totalUnits;

      await tx.holding.update({
        where: { id: holding.id },
        data: {
          unitsTotal: totalUnits,
          avgBuyPrice: newAvgPrice,
        },
      });
    }
  } else if (type === "SELL") {
    if (!holding) {
      throw new ValidationError("Cannot SELL: No holding found for this asset");
    }

    if (Number(holding.unitsTotal) < units) {
      throw new ValidationError(
        `Cannot SELL: Insufficient units. Available: ${holding.unitsTotal}, Requested: ${units}`
      );
    }

    const remainingUnits = Number(holding.unitsTotal) - units;

    if (remainingUnits === 0) {
      // Delete holding if no units left
      await tx.holding.delete({
        where: { id: holding.id },
      });
    } else {
      // Update holding (avgBuyPrice stays the same)
      await tx.holding.update({
        where: { id: holding.id },
        data: {
          unitsTotal: remainingUnits,
        },
      });
    }
  }
}

async function reverseHolding(
  tx: any,
  userId: string,
  assetId: string,
  type: InvestmentTransactionType,
  units: number,
  pricePerUnit: number
) {
  if (type === "BUY") {
    // Reverse BUY = SELL
    const holding = await tx.holding.findUnique({
      where: {
        userId_assetId: {
          userId,
          assetId,
        },
      },
    });

    if (!holding) {
      throw new ValidationError("Cannot reverse: Holding not found");
    }

    const remainingUnits = Number(holding.unitsTotal) - units;

    if (remainingUnits <= 0) {
      await tx.holding.delete({
        where: { id: holding.id },
      });
    } else {
      // Recalculate avgBuyPrice (reverse weighted average)
      const currentValue = Number(holding.unitsTotal) * Number(holding.avgBuyPrice);
      const removedValue = units * pricePerUnit;
      const newAvgPrice = remainingUnits > 0 ? (currentValue - removedValue) / remainingUnits : 0;

      await tx.holding.update({
        where: { id: holding.id },
        data: {
          unitsTotal: remainingUnits,
          avgBuyPrice: newAvgPrice > 0 ? newAvgPrice : holding.avgBuyPrice,
        },
      });
    }
  } else if (type === "SELL") {
    // Reverse SELL = BUY
    let holding = await tx.holding.findUnique({
      where: {
        userId_assetId: {
          userId,
          assetId,
        },
      },
    });

    if (!holding) {
      // Create new holding
      await tx.holding.create({
        data: {
          userId,
          assetId,
          unitsTotal: units,
          avgBuyPrice: pricePerUnit,
        },
      });
    } else {
      // Recalculate weighted average
      const currentValue = Number(holding.unitsTotal) * Number(holding.avgBuyPrice);
      const addedValue = units * pricePerUnit;
      const totalUnits = Number(holding.unitsTotal) + units;
      const newAvgPrice = (currentValue + addedValue) / totalUnits;

      await tx.holding.update({
        where: { id: holding.id },
        data: {
          unitsTotal: totalUnits,
          avgBuyPrice: newAvgPrice,
        },
      });
    }
  }
}

export async function createInvestmentTransaction(
  userId: string,
  data: CreateInvestmentTransactionInput
) {
  // Verify asset
  const asset = await prisma.investmentAsset.findUnique({
    where: { id: data.assetId },
  });

  if (!asset) {
    throw new NotFoundError("Investment asset not found");
  }

  if (asset.userId !== userId) {
    throw new ForbiddenError("You don't have access to this investment asset");
  }

  // Verify cash account if provided
  if (data.cashAccountId) {
    const cashAccount = await prisma.account.findUnique({
      where: { id: data.cashAccountId },
    });

    if (!cashAccount) {
      throw new NotFoundError("Cash account not found");
    }

    if (cashAccount.userId !== userId) {
      throw new ForbiddenError("You don't have access to this cash account");
    }
  }

  // Calculate netAmount
  const netAmount = calculateNetAmount(data.type, data);

  // Create transaction with holding and balance updates
  const transaction = await prisma.$transaction(async tx => {
    // Create transaction
    const newTransaction = await tx.investmentTransaction.create({
      data: {
        userId,
        assetId: data.assetId,
        type: data.type,
        units: data.type === "BUY" || data.type === "SELL" ? data.units : null,
        pricePerUnit:
          data.type === "BUY" || data.type === "SELL" ? data.pricePerUnit : null,
        grossAmount:
          data.type === "BUY" || data.type === "SELL"
            ? data.grossAmount || Number(data.units) * Number(data.pricePerUnit)
            : null,
        feeAmount: data.type === "BUY" || data.type === "SELL" ? data.feeAmount || 0 : 0,
        taxAmount: data.type === "BUY" || data.type === "SELL" ? data.taxAmount || 0 : 0,
        netAmount,
        occurredAt: data.occurredAt,
        note: data.note,
        cashAccountId: data.cashAccountId || null,
      },
    });

    // Update holding for BUY/SELL
    if ((data.type === "BUY" || data.type === "SELL") && data.units && data.pricePerUnit) {
      await updateHolding(tx, userId, data.assetId, data.type, data.units, data.pricePerUnit);
    }

    // Update cash account balance
    if (data.cashAccountId) {
      let balanceChange = 0;

      if (data.type === "BUY" || data.type === "DEPOSIT" || data.type === "FEE") {
        // Money going out (decrease balance)
        balanceChange = -netAmount;
      } else if (data.type === "SELL" || data.type === "DIVIDEND") {
        // Money coming in (increase balance)
        balanceChange = netAmount;
      } else if (data.type === "WITHDRAW") {
        // Money going out (decrease balance)
        balanceChange = -netAmount;
      }

      if (balanceChange !== 0) {
        await tx.account.update({
          where: { id: data.cashAccountId },
          data: {
            currentBalance: {
              increment: balanceChange,
            },
          },
        });
      }
    }

    return newTransaction;
  });

  // Fetch with relations
  return getInvestmentTransactionById(transaction.id, userId);
}

export async function updateInvestmentTransaction(
  transactionId: string,
  userId: string,
  data: UpdateInvestmentTransactionInput
) {
  // Get existing transaction
  const existingTransaction = await getInvestmentTransactionById(transactionId, userId);

  // Update transaction with holding adjustment
  const transaction = await prisma.$transaction(async tx => {
    // Reverse old holding changes if BUY/SELL
    if (
      (existingTransaction.type === "BUY" || existingTransaction.type === "SELL") &&
      existingTransaction.units &&
      existingTransaction.pricePerUnit
    ) {
      await reverseHolding(
        tx,
        userId,
        existingTransaction.assetId,
        existingTransaction.type,
        Number(existingTransaction.units),
        Number(existingTransaction.pricePerUnit)
      );
    }

    // Reverse old cash account balance
    if (existingTransaction.cashAccountId) {
      let balanceChange = 0;

      // Reverse the original balance change
      if (
        existingTransaction.type === "BUY" ||
        existingTransaction.type === "DEPOSIT" ||
        existingTransaction.type === "FEE"
      ) {
        // Original: decreased balance, reverse: increase balance
        balanceChange = Number(existingTransaction.netAmount);
      } else if (existingTransaction.type === "SELL" || existingTransaction.type === "DIVIDEND") {
        // Original: increased balance, reverse: decrease balance
        balanceChange = -Number(existingTransaction.netAmount);
      } else if (existingTransaction.type === "WITHDRAW") {
        // Original: decreased balance, reverse: increase balance
        balanceChange = Number(existingTransaction.netAmount);
      }

      if (balanceChange !== 0) {
        await tx.account.update({
          where: { id: existingTransaction.cashAccountId },
          data: {
            currentBalance: {
              increment: balanceChange,
            },
          },
        });
      }
    }

    // Determine new values
    const newType = data.type || existingTransaction.type;
    const newAssetId = data.assetId || existingTransaction.assetId;
    const newUnits = data.units !== undefined ? data.units : existingTransaction.units;
    const newPricePerUnit =
      data.pricePerUnit !== undefined
        ? data.pricePerUnit
        : existingTransaction.pricePerUnit;
    const newCashAccountId =
      data.cashAccountId !== undefined
        ? data.cashAccountId
        : existingTransaction.cashAccountId;

    // Calculate new netAmount
    let newNetAmount = existingTransaction.netAmount;
    if (data.netAmount) {
      newNetAmount = data.netAmount;
    } else if (
      (newType === "BUY" || newType === "SELL") &&
      newUnits &&
      newPricePerUnit
    ) {
      const gross = data.grossAmount || Number(newUnits) * Number(newPricePerUnit);
      const fee = Number(data.feeAmount !== undefined ? data.feeAmount : existingTransaction.feeAmount || 0);
      const tax = Number(data.taxAmount !== undefined ? data.taxAmount : existingTransaction.taxAmount || 0);
      newNetAmount = gross - fee - tax;
    }

    // Apply new holding changes
    if ((newType === "BUY" || newType === "SELL") && newUnits && newPricePerUnit) {
      await updateHolding(tx, userId, newAssetId, newType, Number(newUnits), Number(newPricePerUnit));
    }

    // Apply new cash account balance
    if (newCashAccountId) {
      let balanceChange = 0;

      if (newType === "BUY" || newType === "DEPOSIT" || newType === "FEE") {
        balanceChange = -Number(newNetAmount);
      } else if (newType === "SELL" || newType === "DIVIDEND") {
        balanceChange = Number(newNetAmount);
      } else if (newType === "WITHDRAW") {
        balanceChange = -Number(newNetAmount);
      }

      if (balanceChange !== 0) {
        await tx.account.update({
          where: { id: newCashAccountId },
          data: {
            currentBalance: {
              increment: balanceChange,
            },
          },
        });
      }
    }

    // Update transaction
    const updatedTransaction = await tx.investmentTransaction.update({
      where: { id: transactionId },
      data: {
        ...(data.assetId && { assetId: data.assetId }),
        ...(data.type && { type: data.type }),
        ...(data.units !== undefined && { units: data.units }),
        ...(data.pricePerUnit !== undefined && { pricePerUnit: data.pricePerUnit }),
        ...(data.grossAmount !== undefined && { grossAmount: data.grossAmount }),
        ...(data.feeAmount !== undefined && { feeAmount: data.feeAmount }),
        ...(data.taxAmount !== undefined && { taxAmount: data.taxAmount }),
        ...(data.netAmount !== undefined && { netAmount: data.netAmount }),
        ...(data.occurredAt && { occurredAt: data.occurredAt }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.cashAccountId !== undefined && { cashAccountId: data.cashAccountId }),
        netAmount: newNetAmount,
      },
    });

    return updatedTransaction;
  });

  // Fetch with relations
  return getInvestmentTransactionById(transaction.id, userId);
}

export async function deleteInvestmentTransaction(
  transactionId: string,
  userId: string
) {
  // Get existing transaction
  const existingTransaction = await getInvestmentTransactionById(transactionId, userId);

  // Delete transaction with reversal
  await prisma.$transaction(async tx => {
    // Reverse holding changes
    if (
      (existingTransaction.type === "BUY" || existingTransaction.type === "SELL") &&
      existingTransaction.units &&
      existingTransaction.pricePerUnit
    ) {
      await reverseHolding(
        tx,
        userId,
        existingTransaction.assetId,
        existingTransaction.type,
        Number(existingTransaction.units),
        Number(existingTransaction.pricePerUnit)
      );
    }

    // Reverse cash account balance
    if (existingTransaction.cashAccountId) {
      let balanceChange = 0;

      // Reverse the original balance change
      if (
        existingTransaction.type === "BUY" ||
        existingTransaction.type === "DEPOSIT" ||
        existingTransaction.type === "FEE"
      ) {
        // Original: decreased balance, reverse: increase balance
        balanceChange = Number(existingTransaction.netAmount);
      } else if (existingTransaction.type === "SELL" || existingTransaction.type === "DIVIDEND") {
        // Original: increased balance, reverse: decrease balance
        balanceChange = -Number(existingTransaction.netAmount);
      } else if (existingTransaction.type === "WITHDRAW") {
        // Original: decreased balance, reverse: increase balance
        balanceChange = Number(existingTransaction.netAmount);
      }

      if (balanceChange !== 0) {
        await tx.account.update({
          where: { id: existingTransaction.cashAccountId },
          data: {
            currentBalance: {
              increment: balanceChange,
            },
          },
        });
      }
    }

    // Delete transaction
    await tx.investmentTransaction.delete({
      where: { id: transactionId },
    });
  });

  return { success: true };
}
