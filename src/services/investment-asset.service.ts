import prisma from "../config/database.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../utils/errors.js";
import {
  CreateInvestmentAssetInput,
  UpdateInvestmentAssetInput,
} from "../validators/investment-asset.js";
import { InvestmentAssetType } from "@prisma/client";

export async function listInvestmentAssets(
  userId: string,
  filters: {
    assetType?: InvestmentAssetType;
    q?: string;
  }
) {
  const where: any = {
    userId,
  };

  if (filters.assetType) {
    where.assetType = filters.assetType;
  }

  if (filters.q) {
    where.OR = [
      { symbol: { contains: filters.q, mode: "insensitive" } },
      { name: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const assets = await prisma.investmentAsset.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  return assets;
}

export async function getInvestmentAssetById(assetId: string, userId: string) {
  const asset = await prisma.investmentAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new NotFoundError("Investment asset not found");
  }

  if (asset.userId !== userId) {
    throw new ForbiddenError("You don't have access to this investment asset");
  }

  return asset;
}

export async function createInvestmentAsset(
  userId: string,
  data: CreateInvestmentAssetInput
) {
  // Check if symbol already exists for this user
  const existingAsset = await prisma.investmentAsset.findUnique({
    where: {
      userId_symbol: {
        userId,
        symbol: data.symbol,
      },
    },
  });

  if (existingAsset) {
    throw new ValidationError("Asset with this symbol already exists");
  }

  // Create investment asset
  const asset = await prisma.investmentAsset.create({
    data: {
      userId,
      symbol: data.symbol,
      name: data.name,
      assetType: data.assetType,
      exchange: data.exchange || null,
      currency: data.currency,
    },
  });

  return asset;
}

export async function updateInvestmentAsset(
  assetId: string,
  userId: string,
  data: UpdateInvestmentAssetInput
) {
  // Verify ownership
  const existingAsset = await getInvestmentAssetById(assetId, userId);

  // Check symbol uniqueness if symbol is being updated
  if (data.symbol && data.symbol !== existingAsset.symbol) {
    const existingAssetWithSymbol = await prisma.investmentAsset.findUnique({
      where: {
        userId_symbol: {
          userId,
          symbol: data.symbol,
        },
      },
    });

    if (existingAssetWithSymbol && existingAssetWithSymbol.id !== assetId) {
      throw new ValidationError("Asset with this symbol already exists");
    }
  }

  // Update investment asset
  const asset = await prisma.investmentAsset.update({
    where: { id: assetId },
    data: {
      ...(data.symbol && { symbol: data.symbol }),
      ...(data.name && { name: data.name }),
      ...(data.assetType && { assetType: data.assetType }),
      ...(data.exchange !== undefined && { exchange: data.exchange }),
      ...(data.currency && { currency: data.currency }),
    },
  });

  return asset;
}
