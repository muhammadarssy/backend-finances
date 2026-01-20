import prisma from "../config/database.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/errors.js";
import { PriceAlertCondition } from "@prisma/client";

export async function listPriceAlerts(
  userId: string,
  filters: {
    isActive?: boolean;
  }
) {
  const where: any = {
    userId,
  };

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const alerts = await prisma.priceAlert.findMany({
    where,
    include: {
      asset: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return alerts;
}

export async function createPriceAlert(
  assetId: string,
  condition: PriceAlertCondition,
  targetPrice: string,
  userId: string
) {
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

  // Validate target price
  const targetPriceNum = Number(targetPrice);
  if (isNaN(targetPriceNum) || targetPriceNum <= 0) {
    throw new ValidationError("Target price must be a positive number");
  }

  // Create price alert
  const alert = await prisma.priceAlert.create({
    data: {
      userId,
      assetId,
      condition,
      targetPrice: targetPriceNum,
      isActive: true,
    },
    include: {
      asset: true,
    },
  });

  return alert;
}

export async function updatePriceAlert(
  alertId: string,
  userId: string,
  updates: {
    isActive?: boolean;
    condition?: PriceAlertCondition;
    targetPrice?: string;
  }
) {
  // Verify ownership
  const alert = await prisma.priceAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new NotFoundError("Price alert not found");
  }

  if (alert.userId !== userId) {
    throw new ForbiddenError("You don't have access to this price alert");
  }

  // Prepare update data
  const updateData: any = {};

  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
    // Reset triggeredAt if reactivating
    if (updates.isActive && alert.triggeredAt) {
      updateData.triggeredAt = null;
    }
  }

  if (updates.condition !== undefined) {
    updateData.condition = updates.condition;
  }

  if (updates.targetPrice !== undefined) {
    const targetPriceNum = Number(updates.targetPrice);
    if (isNaN(targetPriceNum) || targetPriceNum <= 0) {
      throw new ValidationError("Target price must be a positive number");
    }
    updateData.targetPrice = targetPriceNum;
  }

  // Update alert
  const updatedAlert = await prisma.priceAlert.update({
    where: { id: alertId },
    data: updateData,
    include: {
      asset: true,
    },
  });

  return updatedAlert;
}

export async function deletePriceAlert(alertId: string, userId: string) {
  // Verify ownership
  const alert = await prisma.priceAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new NotFoundError("Price alert not found");
  }

  if (alert.userId !== userId) {
    throw new ForbiddenError("You don't have access to this price alert");
  }

  // Delete alert
  await prisma.priceAlert.delete({
    where: { id: alertId },
  });

  return { success: true };
}
