import prisma from "../config/database.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/errors.js";

export async function listWatchlist(userId: string) {
  const watchlist = await prisma.watchlist.findMany({
    where: { userId },
    include: {
      asset: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return watchlist;
}

export async function addToWatchlist(assetId: string, userId: string) {
  // Verify asset exists and is owned by user
  const asset = await prisma.investmentAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new NotFoundError("Investment asset not found");
  }

  if (asset.userId !== userId) {
    throw new ForbiddenError("You don't have access to this investment asset");
  }

  // Check if already in watchlist
  const existing = await prisma.watchlist.findUnique({
    where: {
      userId_assetId: {
        userId,
        assetId,
      },
    },
  });

  if (existing) {
    throw new ValidationError("Asset is already in your watchlist");
  }

  // Create watchlist entry
  const watchlist = await prisma.watchlist.create({
    data: {
      userId,
      assetId,
    },
    include: {
      asset: true,
    },
  });

  return watchlist;
}

export async function removeFromWatchlist(watchlistId: string, userId: string) {
  // Verify ownership
  const watchlist = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
  });

  if (!watchlist) {
    throw new NotFoundError("Watchlist item not found");
  }

  if (watchlist.userId !== userId) {
    throw new ForbiddenError("You don't have access to this watchlist item");
  }

  // Delete watchlist entry
  await prisma.watchlist.delete({
    where: { id: watchlistId },
  });

  return { success: true };
}
