import prisma from "../config/database.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../utils/errors.js";
import { UpsertBudgetInput } from "../validators/budget.js";
import { TransactionType } from "@prisma/client";

export async function getBudgetByMonth(
  userId: string,
  month?: number,
  year?: number
) {
  const currentDate = new Date();
  const targetMonth = month || currentDate.getMonth() + 1;
  const targetYear = year || currentDate.getFullYear();

  // Get or create budget
  let budget = await prisma.budget.findUnique({
    where: {
      userId_month_year: {
        userId,
        month: targetMonth,
        year: targetYear,
      },
    },
    include: {
      items: {
        include: {
          category: true,
        },
      },
    },
  });

  // If budget doesn't exist, return empty structure
  if (!budget) {
    return {
      id: null,
      month: targetMonth,
      year: targetYear,
      totalLimit: null,
      items: [],
    };
  }

  // Calculate spent per category from transactions
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: TransactionType.EXPENSE,
      categoryId: {
        in: budget.items.map(item => item.categoryId),
      },
      occurredAt: {
        gte: startDate,
        lte: endDate,
      },
      isDeleted: false,
    },
    select: {
      categoryId: true,
      amount: true,
    },
  });

  // Calculate spent per category
  const spentByCategory = transactions.reduce((acc, tx) => {
    if (tx.categoryId) {
      acc[tx.categoryId] = (acc[tx.categoryId] || 0) + Number(tx.amount);
    }
    return acc;
  }, {} as Record<string, number>);

  // Add spent to items
  const itemsWithSpent = budget.items.map(item => ({
    categoryId: item.categoryId,
    limitAmount: item.limitAmount,
    spent: spentByCategory[item.categoryId] || 0,
    category: item.category,
  }));

  return {
    id: budget.id,
    month: budget.month,
    year: budget.year,
    totalLimit: budget.totalLimit,
    items: itemsWithSpent,
  };
}

export async function upsertBudget(userId: string, data: UpsertBudgetInput) {
  // Validate month and year
  if (data.month < 1 || data.month > 12) {
    throw new ValidationError("Month must be between 1 and 12");
  }

  // Validate all categories exist and belong to user
  const categories = await prisma.category.findMany({
    where: {
      id: { in: data.items.map(item => item.categoryId) },
      userId,
      type: "EXPENSE", // Budgets only for expense categories
    },
  });

  if (categories.length !== data.items.length) {
    throw new ValidationError("One or more categories not found or not expense type");
  }

  // Check for duplicate categoryIds
  const categoryIds = data.items.map(item => item.categoryId);
  if (new Set(categoryIds).size !== categoryIds.length) {
    throw new ValidationError("Duplicate categoryId in items");
  }

  // Upsert budget
  const budget = await prisma.$transaction(async tx => {
    // Upsert budget
    const upsertedBudget = await tx.budget.upsert({
      where: {
        userId_month_year: {
          userId,
          month: data.month,
          year: data.year,
        },
      },
      update: {
        totalLimit: data.totalLimit,
      },
      create: {
        userId,
        month: data.month,
        year: data.year,
        totalLimit: data.totalLimit,
      },
    });

    // Delete existing items
    await tx.budgetItem.deleteMany({
      where: {
        budgetId: upsertedBudget.id,
      },
    });

    // Create new items
    if (data.items.length > 0) {
      await tx.budgetItem.createMany({
        data: data.items.map(item => ({
          budgetId: upsertedBudget.id,
          categoryId: item.categoryId,
          limitAmount: item.limitAmount,
        })),
      });
    }

    // Fetch with items
    return tx.budget.findUnique({
      where: { id: upsertedBudget.id },
      include: {
        items: {
          include: {
            category: true,
          },
        },
      },
    });
  });

  if (!budget) {
    throw new NotFoundError("Budget not found after upsert");
  }

  return budget;
}

export async function getBudgetById(budgetId: string, userId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      items: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!budget) {
    throw new NotFoundError("Budget not found");
  }

  if (budget.userId !== userId) {
    throw new ForbiddenError("You don't have access to this budget");
  }

  return budget;
}

export async function deleteBudget(budgetId: string, userId: string) {
  // Verify ownership
  await getBudgetById(budgetId, userId);

  // Delete budget (cascade will delete budget items)
  await prisma.budget.delete({
    where: { id: budgetId },
  });

  return { success: true };
}
