import prisma from "../config/database.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { InvestmentAssetType, InvestmentTransactionType } from "@prisma/client";

export async function getPortfolioSummary(userId: string) {
  // Get all holdings
  const holdings = await prisma.holding.findMany({
    where: { userId },
    include: {
      asset: true,
    },
  });

  // Calculate cost basis (total invested)
  let totalCostBasis = 0;
  const allocationByType: Record<string, number> = {};

  for (const holding of holdings) {
    const costBasis = Number(holding.unitsTotal) * Number(holding.avgBuyPrice);
    totalCostBasis += costBasis;

    const assetType = holding.asset.assetType;
    allocationByType[assetType] = (allocationByType[assetType] || 0) + costBasis;
  }

  // Calculate realized P/L from SELL transactions
  const sellTransactions = await prisma.investmentTransaction.findMany({
    where: {
      userId,
      type: InvestmentTransactionType.SELL,
    },
    select: {
      units: true,
      pricePerUnit: true,
      netAmount: true,
      asset: {
        select: {
          assetType: true,
        },
      },
    },
  });

  let realizedPL = 0;
  for (const sell of sellTransactions) {
    if (sell.units && sell.pricePerUnit) {
      // For SELL, we need to calculate profit/loss
      // This is simplified - in reality we'd need to track which units were sold at what price
      // For now, we'll use a simple calculation
      const sellValue = Number(sell.netAmount);
      const costBasis = Number(sell.units) * Number(sell.pricePerUnit);
      // Note: This is simplified. Real calculation needs FIFO/LIFO tracking
      realizedPL += sellValue - costBasis;
    }
  }

  // Format allocation
  const allocation = Object.entries(allocationByType).map(([assetType, value]) => ({
    assetType,
    value: value.toString(),
  }));

  // Note: unrealizedPL requires current market prices
  // For now, we'll return 0 and totalValue = costBasis
  // In production, you'd integrate with a price API

  return {
    totalValue: totalCostBasis.toString(), // Using cost basis as placeholder
    unrealizedPL: "0", // Requires current prices
    realizedPL: realizedPL.toString(),
    allocation,
    // Additional info
    totalCostBasis: totalCostBasis.toString(),
    note: "Current prices not available. totalValue shows cost basis. unrealizedPL requires price integration.",
  };
}

export async function listHoldings(
  userId: string,
  filters: {
    assetType?: InvestmentAssetType;
  }
) {
  const where: any = {
    userId,
  };

  if (filters.assetType) {
    where.asset = {
      assetType: filters.assetType,
    };
  }

  const holdings = await prisma.holding.findMany({
    where,
    include: {
      asset: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Calculate cost basis for each holding
  const holdingsWithCostBasis = holdings.map(holding => ({
    ...holding,
    costBasis: Number(holding.unitsTotal) * Number(holding.avgBuyPrice),
    // currentValue would require current price
  }));

  return holdingsWithCostBasis;
}

export async function getHoldingByAssetId(assetId: string, userId: string) {
  // Verify asset ownership
  const asset = await prisma.investmentAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new NotFoundError("Investment asset not found");
  }

  if (asset.userId !== userId) {
    throw new ForbiddenError("You don't have access to this investment asset");
  }

  // Get holding
  const holding = await prisma.holding.findUnique({
    where: {
      userId_assetId: {
        userId,
        assetId,
      },
    },
    include: {
      asset: true,
    },
  });

  if (!holding) {
    throw new NotFoundError("Holding not found for this asset");
  }

  // Get transaction history for this asset
  const transactions = await prisma.investmentTransaction.findMany({
    where: {
      userId,
      assetId,
    },
    orderBy: {
      occurredAt: "desc",
    },
    take: 50, // Last 50 transactions
  });

  const costBasis = Number(holding.unitsTotal) * Number(holding.avgBuyPrice);

  return {
    ...holding,
    costBasis,
    transactions,
  };
}

export async function rebuildHoldings(userId: string) {
  // Get all investment transactions for this user
  const transactions = await prisma.investmentTransaction.findMany({
    where: {
      userId,
      type: {
        in: [InvestmentTransactionType.BUY, InvestmentTransactionType.SELL],
      },
    },
    include: {
      asset: true,
    },
    orderBy: {
      occurredAt: "asc",
    },
  });

  // Clear all existing holdings
  await prisma.holding.deleteMany({
    where: { userId },
  });

  // Recalculate holdings from transactions
  const holdingsMap = new Map<
    string,
    { unitsTotal: number; totalCostBasis: number }
  >();

  for (const tx of transactions) {
    if (!tx.units || !tx.pricePerUnit) continue;

    const assetId = tx.assetId;
    const units = Number(tx.units);
    const pricePerUnit = Number(tx.pricePerUnit);

    if (!holdingsMap.has(assetId)) {
      holdingsMap.set(assetId, { unitsTotal: 0, totalCostBasis: 0 });
    }

    const holding = holdingsMap.get(assetId)!;

    if (tx.type === InvestmentTransactionType.BUY) {
      // Add to holding
      const currentCostBasis = holding.totalCostBasis;
      const newCostBasis = units * pricePerUnit;
      const totalCostBasis = currentCostBasis + newCostBasis;
      const totalUnits = holding.unitsTotal + units;
      const avgPrice = totalUnits > 0 ? totalCostBasis / totalUnits : pricePerUnit;

      holding.unitsTotal = totalUnits;
      holding.totalCostBasis = totalCostBasis;
    } else if (tx.type === InvestmentTransactionType.SELL) {
      if (holding.unitsTotal < units) {
        // Skip invalid SELL (shouldn't happen if data is consistent)
        continue;
      }

      // Calculate average price before sell
      const avgPrice = holding.unitsTotal > 0 ? holding.totalCostBasis / holding.unitsTotal : 0;

      // Subtract from holding (FIFO-like: use average price)
      holding.unitsTotal -= units;
      holding.totalCostBasis = holding.unitsTotal * avgPrice;
    }
  }

  // Create holdings
  const holdingsToCreate = Array.from(holdingsMap.entries())
    .filter(([_, holding]) => holding.unitsTotal > 0)
    .map(([assetId, holding]) => ({
      userId,
      assetId,
      unitsTotal: holding.unitsTotal,
      avgBuyPrice: holding.totalCostBasis / holding.unitsTotal,
    }));

  if (holdingsToCreate.length > 0) {
    await prisma.holding.createMany({
      data: holdingsToCreate,
    });
  }

  return {
    success: true,
    holdingsCreated: holdingsToCreate.length,
    transactionsProcessed: transactions.length,
  };
}
