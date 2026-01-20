import prisma from "../config/database.js";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../utils/errors.js";
import {
  CreateRecurringInput,
  UpdateRecurringInput,
  ToggleRecurringInput,
} from "../validators/recurring.js";
import { TransactionType } from "@prisma/client";
import {
  calculateNextRunAt,
  validateScheduleValue,
} from "../utils/recurring.js";

export async function listRecurringRules(userId: string) {
  const rules = await prisma.recurringRule.findMany({
    where: { userId },
    include: {
      category: true,
      account: true,
      runs: {
        orderBy: {
          executedAt: "desc",
        },
        take: 5, // Last 5 runs
      },
    },
    orderBy: {
      nextRunAt: "asc",
    },
  });

  return rules;
}

export async function getRecurringRuleById(ruleId: string, userId: string) {
  const rule = await prisma.recurringRule.findUnique({
    where: { id: ruleId },
    include: {
      category: true,
      account: true,
      runs: {
        include: {
          transaction: true,
        },
        orderBy: {
          executedAt: "desc",
        },
      },
    },
  });

  if (!rule) {
    throw new NotFoundError("Recurring rule not found");
  }

  if (rule.userId !== userId) {
    throw new ForbiddenError("You don't have access to this recurring rule");
  }

  return rule;
}

export async function createRecurringRule(
  userId: string,
  data: CreateRecurringInput
) {
  // Validate scheduleValue
  if (!validateScheduleValue(data.scheduleType, data.scheduleValue)) {
    throw new ValidationError(
      `Invalid scheduleValue for scheduleType ${data.scheduleType}`
    );
  }

  // Verify category
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  if (category.userId !== userId) {
    throw new ForbiddenError("You don't have access to this category");
  }

  if (category.type !== data.type) {
    throw new ValidationError("Category type must match recurring rule type");
  }

  // Verify account
  const account = await prisma.account.findUnique({
    where: { id: data.accountId },
  });

  if (!account) {
    throw new NotFoundError("Account not found");
  }

  if (account.userId !== userId) {
    throw new ForbiddenError("You don't have access to this account");
  }

  // Create recurring rule
  const rule = await prisma.recurringRule.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      categoryId: data.categoryId,
      accountId: data.accountId,
      scheduleType: data.scheduleType,
      scheduleValue: data.scheduleValue,
      nextRunAt: data.nextRunAt,
      isActive: data.isActive,
    },
    include: {
      category: true,
      account: true,
    },
  });

  return rule;
}

export async function updateRecurringRule(
  ruleId: string,
  userId: string,
  data: UpdateRecurringInput
) {
  // Verify ownership
  const existingRule = await getRecurringRuleById(ruleId, userId);

  // Validate scheduleValue if provided
  if (data.scheduleValue !== undefined && data.scheduleType !== undefined) {
    if (!validateScheduleValue(data.scheduleType, data.scheduleValue)) {
      throw new ValidationError(
        `Invalid scheduleValue for scheduleType ${data.scheduleType}`
      );
    }
  } else if (data.scheduleValue !== undefined) {
    // Use existing scheduleType
    if (!validateScheduleValue(existingRule.scheduleType, data.scheduleValue)) {
      throw new ValidationError(
        `Invalid scheduleValue for scheduleType ${existingRule.scheduleType}`
      );
    }
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

    const ruleType = data.type || existingRule.type;
    if (category.type !== ruleType) {
      throw new ValidationError("Category type must match recurring rule type");
    }
  }

  // Verify account if provided
  if (data.accountId) {
    const account = await prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      throw new NotFoundError("Account not found");
    }

    if (account.userId !== userId) {
      throw new ForbiddenError("You don't have access to this account");
    }
  }

  // Update recurring rule
  const rule = await prisma.recurringRule.update({
    where: { id: ruleId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.type && { type: data.type }),
      ...(data.amount && { amount: data.amount }),
      ...(data.currency && { currency: data.currency }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.accountId && { accountId: data.accountId }),
      ...(data.scheduleType && { scheduleType: data.scheduleType }),
      ...(data.scheduleValue && { scheduleValue: data.scheduleValue }),
      ...(data.nextRunAt && { nextRunAt: data.nextRunAt }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      category: true,
      account: true,
      runs: {
        take: 5,
        orderBy: {
          executedAt: "desc",
        },
      },
    },
  });

  return rule;
}

export async function toggleRecurringRule(
  ruleId: string,
  userId: string,
  data: ToggleRecurringInput
) {
  // Verify ownership
  await getRecurringRuleById(ruleId, userId);

  // Update isActive
  const rule = await prisma.recurringRule.update({
    where: { id: ruleId },
    data: {
      isActive: data.isActive,
    },
    include: {
      category: true,
      account: true,
    },
  });

  return rule;
}

export async function runRecurringRule(ruleId: string, userId: string) {
  // Get rule
  const rule = await getRecurringRuleById(ruleId, userId);

  // Check if rule is active
  if (!rule.isActive) {
    throw new ValidationError("Recurring rule is not active");
  }

  // Check if it's time to run
  const now = new Date();
  if (rule.nextRunAt > now) {
    throw new ValidationError(
      `Recurring rule is scheduled to run at ${rule.nextRunAt.toISOString()}`
    );
  }

  // Execute recurring rule
  const result = await prisma.$transaction(async tx => {
    // Create transaction
    const transaction = await tx.transaction.create({
      data: {
        userId: rule.userId,
        type:
          rule.type === "INCOME"
            ? TransactionType.INCOME
            : TransactionType.EXPENSE,
        amount: rule.amount,
        currency: rule.currency,
        occurredAt: rule.nextRunAt,
        accountId: rule.accountId,
        categoryId: rule.categoryId,
        note: `Recurring: ${rule.name}`,
        isDeleted: false,
      },
    });

    // Update account balance
    const balanceChange =
      rule.type === "INCOME" ? rule.amount : -rule.amount;

    await tx.account.update({
      where: { id: rule.accountId },
      data: {
        currentBalance: {
          increment: balanceChange,
        },
      },
    });

    // Create RecurringRun record
    await tx.recurringRun.create({
      data: {
        recurringRuleId: rule.id,
        transactionId: transaction.id,
        executedAt: now,
      },
    });

    // Calculate next run date (from the executed date, not from nextRunAt)
    const executedDate = rule.nextRunAt <= now ? rule.nextRunAt : now;
    const nextRunAt = calculateNextRunAt(
      rule.scheduleType,
      rule.scheduleValue,
      executedDate
    );

    // Update rule nextRunAt
    await tx.recurringRule.update({
      where: { id: rule.id },
      data: {
        nextRunAt,
      },
    });

    return { transaction, nextRunAt };
  });

  // Fetch updated rule
  return getRecurringRuleById(ruleId, userId);
}
