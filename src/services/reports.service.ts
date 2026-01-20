import prisma from "../config/database.js";
import { TransactionType } from "@prisma/client";
import { startOfMonth, endOfMonth, parseISO, format, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

export async function getMonthlyFinanceSummary(
  userId: string,
  month: number,
  year: number
) {
  // Create date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = endOfMonth(startDate);

  // Get all transactions for the month
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      occurredAt: {
        gte: startDate,
        lte: endDate,
      },
      isDeleted: false,
    },
    include: {
      category: true,
    },
  });

  // Calculate totals
  let income = 0;
  let expense = 0;
  const byCategory: Record<string, { categoryId: string; categoryName: string; total: number }> = {};

  for (const tx of transactions) {
    const amount = Number(tx.amount);

    if (tx.type === TransactionType.INCOME) {
      income += amount;
    } else if (tx.type === TransactionType.EXPENSE) {
      expense += amount;

      // Group by category
      const categoryId = tx.categoryId || "uncategorized";
      if (!byCategory[categoryId]) {
        byCategory[categoryId] = {
          categoryId,
          categoryName: tx.category?.name || "Uncategorized",
          total: 0,
        };
      }
      byCategory[categoryId].total += amount;
    }
  }

  const cashflow = income - expense;

  return {
    income: income.toString(),
    expense: expense.toString(),
    cashflow: cashflow.toString(),
    byCategory: Object.values(byCategory).map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      total: cat.total.toString(),
    })),
  };
}

export async function getBudgetUsageReport(
  userId: string,
  month: number,
  year: number
) {
  // Get budget for the month
  const budget = await prisma.budget.findFirst({
    where: {
      userId,
      month,
      year,
    },
    include: {
      items: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!budget) {
    return {
      budget: null,
      usage: [],
      totalBudgeted: "0",
      totalSpent: "0",
      totalRemaining: "0",
    };
  }

  // Create date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = endOfMonth(startDate);

  // Get all expense transactions for the month
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: TransactionType.EXPENSE,
      occurredAt: {
        gte: startDate,
        lte: endDate,
      },
      isDeleted: false,
    },
  });

  // Calculate spent per category
  const spentByCategory: Record<string, number> = {};
  for (const tx of transactions) {
    const categoryId = tx.categoryId || "uncategorized";
    spentByCategory[categoryId] = (spentByCategory[categoryId] || 0) + Number(tx.amount);
  }

  // Build usage report
  const usage = budget.items.map((item) => {
    const spent = spentByCategory[item.categoryId] || 0;
    const limit = Number(item.limit);
    const remaining = limit - spent;
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;

    return {
      categoryId: item.categoryId,
      categoryName: item.category.name,
      budgeted: item.limit.toString(),
      spent: spent.toString(),
      remaining: remaining.toString(),
      percentage: percentage.toFixed(2),
      isOverBudget: spent > limit,
    };
  });

  const totalBudgeted = budget.items.reduce((sum, item) => sum + Number(item.limit), 0);
  const totalSpent = Object.values(spentByCategory).reduce((sum, val) => sum + val, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  return {
    budget: {
      id: budget.id,
      month: budget.month,
      year: budget.year,
    },
    usage,
    totalBudgeted: totalBudgeted.toString(),
    totalSpent: totalSpent.toString(),
    totalRemaining: totalRemaining.toString(),
  };
}

export async function getNetWorthReport(
  userId: string,
  from: string,
  to: string,
  interval: "day" | "month"
) {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);

  // Get all accounts (excluding archived)
  const accounts = await prisma.account.findMany({
    where: {
      userId,
      isArchived: false,
    },
  });

  // Get all holdings
  const holdings = await prisma.holding.findMany({
    where: { userId },
    include: {
      asset: true,
    },
  });

  // Calculate current net worth
  const accountBalances = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const investmentValue = holdings.reduce(
    (sum, h) => sum + Number(h.unitsTotal) * Number(h.avgBuyPrice),
    0
  );
  const currentNetWorth = accountBalances + investmentValue;

  // For historical data, we'd need transaction history
  // For now, we'll return a simplified version with current snapshot
  // In production, you'd calculate net worth at each interval point

  const intervals: string[] = [];
  const values: string[] = [];

  if (interval === "day") {
    const days = eachDayOfInterval({ start: fromDate, end: toDate });
    // Simplified: return current value for all days
    // In production, calculate from transaction history
    days.forEach((day) => {
      intervals.push(format(day, "yyyy-MM-dd"));
      values.push(currentNetWorth.toString());
    });
  } else if (interval === "month") {
    const months = eachMonthOfInterval({ start: fromDate, end: toDate });
    months.forEach((month) => {
      intervals.push(format(month, "yyyy-MM"));
      values.push(currentNetWorth.toString());
    });
  }

  return {
    from,
    to,
    interval,
    timeline: intervals.map((interval, index) => ({
      period: interval,
      netWorth: values[index],
      // Note: This is simplified. In production, calculate from historical data
    })),
    current: {
      accountBalances: accountBalances.toString(),
      investmentValue: investmentValue.toString(),
      netWorth: currentNetWorth.toString(),
    },
    note: "Historical values are simplified. Full implementation requires transaction history calculation.",
  };
}

export async function getInvestmentPerformanceReport(
  userId: string,
  from: string,
  to: string
) {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);

  // Get all investment transactions in the period
  const transactions = await prisma.investmentTransaction.findMany({
    where: {
      userId,
      occurredAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    include: {
      asset: true,
    },
  });

  // Get current holdings
  const holdings = await prisma.holding.findMany({
    where: { userId },
    include: {
      asset: true,
    },
  });

  // Calculate total invested (cost basis)
  let totalInvested = 0;
  const investedByAsset: Record<string, number> = {};
  const investedByType: Record<string, number> = {};

  for (const holding of holdings) {
    const costBasis = Number(holding.unitsTotal) * Number(holding.avgBuyPrice);
    totalInvested += costBasis;

    investedByAsset[holding.assetId] = (investedByAsset[holding.assetId] || 0) + costBasis;
    investedByType[holding.asset.assetType] =
      (investedByType[holding.asset.assetType] || 0) + costBasis;
  }

  // Calculate realized P/L from SELL transactions in period
  const sellTransactions = transactions.filter(
    (tx) => tx.type === "SELL" && tx.units && tx.pricePerUnit
  );

  let realizedPL = 0;
  for (const sell of sellTransactions) {
    // Simplified calculation
    const sellValue = Number(sell.netAmount || 0);
    const costBasis = Number(sell.units!) * Number(sell.pricePerUnit!);
    realizedPL += sellValue - costBasis;
  }

  // Current value (using cost basis as placeholder - requires price API)
  const currentValue = totalInvested;
  const unrealizedPL = 0; // Requires current prices
  const totalReturn = realizedPL + unrealizedPL;
  const roi = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Group by asset
  const byAsset = Object.entries(investedByAsset).map(([assetId, invested]) => {
    const asset = holdings.find((h) => h.assetId === assetId)?.asset;
    return {
      assetId,
      assetName: asset?.name || "Unknown",
      assetType: asset?.assetType || "OTHER",
      invested: invested.toString(),
      // currentValue and return would require price API
    };
  });

  // Group by asset type
  const byType = Object.entries(investedByType).map(([assetType, invested]) => ({
    assetType,
    invested: invested.toString(),
    percentage: totalInvested > 0 ? ((invested / totalInvested) * 100).toFixed(2) : "0",
  }));

  return {
    period: {
      from,
      to,
    },
    summary: {
      totalInvested: totalInvested.toString(),
      currentValue: currentValue.toString(),
      unrealizedPL: unrealizedPL.toString(),
      realizedPL: realizedPL.toString(),
      totalReturn: totalReturn.toString(),
      roi: roi.toFixed(2),
    },
    byAsset,
    byType,
    note: "Current value and unrealized P/L require price API integration. Values shown are based on cost basis.",
  };
}
