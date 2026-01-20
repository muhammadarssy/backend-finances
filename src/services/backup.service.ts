import prisma from "../config/database.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

export async function exportAllDataToJSON(userId: string) {
  // Get all user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Get all related data
  const [
    accounts,
    categories,
    tags,
    transactions,
    budgets,
    bills,
    recurringRules,
    investmentAssets,
    investmentTransactions,
    holdings,
    watchlist,
    priceAlerts,
    debts,
  ] = await Promise.all([
    prisma.account.findMany({
      where: { userId, isArchived: false },
    }),
    prisma.category.findMany({
      where: { userId, isDeleted: false },
    }),
    prisma.tag.findMany({
      where: { userId },
    }),
    prisma.transaction.findMany({
      where: { userId, isDeleted: false },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),
    prisma.budget.findMany({
      where: { userId },
      include: {
        items: true,
      },
    }),
    prisma.bill.findMany({
      where: { userId, isDeleted: false },
    }),
    prisma.recurringRule.findMany({
      where: { userId, isActive: true },
    }),
    prisma.investmentAsset.findMany({
      where: { userId },
    }),
    prisma.investmentTransaction.findMany({
      where: { userId },
    }),
    prisma.holding.findMany({
      where: { userId },
    }),
    prisma.watchlist.findMany({
      where: { userId },
    }),
    prisma.priceAlert.findMany({
      where: { userId },
    }),
    prisma.debt.findMany({
      where: { userId, isDeleted: false },
    }),
  ]);

  // Format data untuk backup
  const backup = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    data: {
      accounts: accounts.map((acc) => ({
        ...acc,
        balance: acc.currentBalance.toString(),
        startingBalance: acc.startingBalance.toString(),
      })),
      categories: categories.map((cat) => ({
        ...cat,
        parentId: cat.parentId || null,
      })),
      tags: tags,
      transactions: transactions.map((tx) => ({
        ...tx,
        amount: tx.amount.toString(),
        accountId: tx.accountId || null,
        categoryId: tx.categoryId || null,
        fromAccountId: tx.fromAccountId || null,
        toAccountId: tx.toAccountId || null,
        tags: tx.tags.map((tt) => tt.tag.name),
      })),
      budgets: budgets.map((budget) => ({
        ...budget,
        items: budget.items.map((item) => ({
          ...item,
          limit: item.limit.toString(),
        })),
      })),
      bills: bills.map((bill) => ({
        ...bill,
        amount: bill.amount.toString(),
        paidAmount: bill.paidAmount.toString(),
      })),
      recurringRules: recurringRules.map((rule) => ({
        ...rule,
        amount: rule.amount.toString(),
        accountId: rule.accountId || null,
        categoryId: rule.categoryId || null,
      })),
      investmentAssets: investmentAssets,
      investmentTransactions: investmentTransactions.map((tx) => ({
        ...tx,
        units: tx.units?.toString() || null,
        pricePerUnit: tx.pricePerUnit?.toString() || null,
        netAmount: tx.netAmount?.toString() || null,
        fee: tx.fee?.toString() || null,
      })),
      holdings: holdings.map((h) => ({
        ...h,
        unitsTotal: h.unitsTotal.toString(),
        avgBuyPrice: h.avgBuyPrice.toString(),
      })),
      watchlist: watchlist,
      priceAlerts: priceAlerts.map((alert) => ({
        ...alert,
        targetPrice: alert.targetPrice.toString(),
      })),
      debts: debts.map((debt) => ({
        ...debt,
        principalAmount: debt.principalAmount.toString(),
        currentBalance: debt.currentBalance.toString(),
        interestRate: debt.interestRate?.toString() || null,
        minimumPayment: debt.minimumPayment?.toString() || null,
      })),
    },
  };

  return JSON.stringify(backup, null, 2);
}

export async function restoreFromBackup(userId: string, backupData: any) {
  // Validate backup structure
  if (!backupData.version || !backupData.data) {
    throw new ValidationError("Invalid backup file format");
  }

  // Verify user matches (optional - bisa skip untuk flexibility)
  if (backupData.user && backupData.user.id !== userId) {
    throw new ValidationError("Backup file does not match current user");
  }

  const data = backupData.data;

  // Use transaction untuk ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Restore dalam urutan yang benar (considering foreign keys)
    // Note: Ini adalah simplified restore. Production perlu handle conflicts, duplicates, dll.

    // 1. Accounts
    if (data.accounts && Array.isArray(data.accounts)) {
      for (const acc of data.accounts) {
        await tx.account.upsert({
          where: { id: acc.id },
          update: {
            name: acc.name,
            type: acc.type,
            currency: acc.currency,
            startingBalance: acc.startingBalance,
            currentBalance: acc.currentBalance,
            isArchived: acc.isArchived || false,
          },
          create: {
            id: acc.id,
            userId,
            name: acc.name,
            type: acc.type,
            currency: acc.currency,
            startingBalance: acc.startingBalance,
            currentBalance: acc.currentBalance,
            isArchived: acc.isArchived || false,
          },
        });
      }
    }

    // 2. Categories (handle hierarchy)
    if (data.categories && Array.isArray(data.categories)) {
      // Sort by parentId (null first)
      const sortedCategories = [...data.categories].sort((a, b) => {
        if (!a.parentId && b.parentId) return -1;
        if (a.parentId && !b.parentId) return 1;
        return 0;
      });

      for (const cat of sortedCategories) {
        await tx.category.upsert({
          where: { id: cat.id },
          update: {
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
            parentId: cat.parentId || null,
            isDeleted: false,
          },
          create: {
            id: cat.id,
            userId,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
            parentId: cat.parentId || null,
          },
        });
      }
    }

    // 3. Tags
    if (data.tags && Array.isArray(data.tags)) {
      for (const tag of data.tags) {
        await tx.tag.upsert({
          where: { id: tag.id },
          update: {
            name: tag.name,
            color: tag.color,
          },
          create: {
            id: tag.id,
            userId,
            name: tag.name,
            color: tag.color,
          },
        });
      }
    }

    // 4. Transactions
    if (data.transactions && Array.isArray(data.transactions)) {
      for (const txData of data.transactions) {
        // Create transaction
        const transaction = await tx.transaction.upsert({
          where: { id: txData.id },
          update: {
            type: txData.type,
            description: txData.description,
            amount: txData.amount,
            occurredAt: new Date(txData.occurredAt),
            accountId: txData.accountId || null,
            categoryId: txData.categoryId || null,
            fromAccountId: txData.fromAccountId || null,
            toAccountId: txData.toAccountId || null,
            notes: txData.notes || null,
            isDeleted: false,
          },
          create: {
            id: txData.id,
            userId,
            type: txData.type,
            description: txData.description,
            amount: txData.amount,
            occurredAt: new Date(txData.occurredAt),
            accountId: txData.accountId || null,
            categoryId: txData.categoryId || null,
            fromAccountId: txData.fromAccountId || null,
            toAccountId: txData.toAccountId || null,
            notes: txData.notes || null,
          },
        });

        // Handle tags
        if (txData.tags && Array.isArray(txData.tags)) {
          // Delete existing tags
          await tx.transactionTag.deleteMany({
            where: { transactionId: transaction.id },
          });

          // Create new tags
          for (const tagName of txData.tags) {
            const tag = await tx.tag.findFirst({
              where: { userId, name: tagName },
            });

            if (tag) {
              await tx.transactionTag.create({
                data: {
                  transactionId: transaction.id,
                  tagId: tag.id,
                },
              });
            }
          }
        }
      }
    }

    // 5. Budgets
    if (data.budgets && Array.isArray(data.budgets)) {
      for (const budgetData of data.budgets) {
        const budget = await tx.budget.upsert({
          where: { id: budgetData.id },
          update: {
            month: budgetData.month,
            year: budgetData.year,
          },
          create: {
            id: budgetData.id,
            userId,
            month: budgetData.month,
            year: budgetData.year,
          },
        });

        // Budget items
        if (budgetData.items && Array.isArray(budgetData.items)) {
          for (const item of budgetData.items) {
            await tx.budgetItem.upsert({
              where: { id: item.id },
              update: {
                categoryId: item.categoryId,
                limit: item.limit,
              },
              create: {
                id: item.id,
                budgetId: budget.id,
                categoryId: item.categoryId,
                limit: item.limit,
              },
            });
          }
        }
      }
    }

    // 6. Bills
    if (data.bills && Array.isArray(data.bills)) {
      for (const bill of data.bills) {
        await tx.bill.upsert({
          where: { id: bill.id },
          update: {
            name: bill.name,
            amount: bill.amount,
            dueDate: new Date(bill.dueDate),
            paidAmount: bill.paidAmount,
            isPaid: bill.isPaid,
            isDeleted: false,
          },
          create: {
            id: bill.id,
            userId,
            name: bill.name,
            amount: bill.amount,
            dueDate: new Date(bill.dueDate),
            paidAmount: bill.paidAmount,
            isPaid: bill.isPaid,
          },
        });
      }
    }

    // 7. Recurring Rules
    if (data.recurringRules && Array.isArray(data.recurringRules)) {
      for (const rule of data.recurringRules) {
        await tx.recurringRule.upsert({
          where: { id: rule.id },
          update: {
            name: rule.name,
            type: rule.type,
            amount: rule.amount,
            schedule: rule.schedule,
            scheduleValue: rule.scheduleValue,
            nextRunAt: rule.nextRunAt ? new Date(rule.nextRunAt) : null,
            accountId: rule.accountId || null,
            categoryId: rule.categoryId || null,
            isActive: rule.isActive,
          },
          create: {
            id: rule.id,
            userId,
            name: rule.name,
            type: rule.type,
            amount: rule.amount,
            schedule: rule.schedule,
            scheduleValue: rule.scheduleValue,
            nextRunAt: rule.nextRunAt ? new Date(rule.nextRunAt) : null,
            accountId: rule.accountId || null,
            categoryId: rule.categoryId || null,
            isActive: rule.isActive,
          },
        });
      }
    }

    // 8. Investment Assets
    if (data.investmentAssets && Array.isArray(data.investmentAssets)) {
      for (const asset of data.investmentAssets) {
        await tx.investmentAsset.upsert({
          where: { id: asset.id },
          update: {
            name: asset.name,
            symbol: asset.symbol,
            assetType: asset.assetType,
            currency: asset.currency,
          },
          create: {
            id: asset.id,
            userId,
            name: asset.name,
            symbol: asset.symbol,
            assetType: asset.assetType,
            currency: asset.currency,
          },
        });
      }
    }

    // 9. Investment Transactions
    if (data.investmentTransactions && Array.isArray(data.investmentTransactions)) {
      for (const txData of data.investmentTransactions) {
        await tx.investmentTransaction.upsert({
          where: { id: txData.id },
          update: {
            type: txData.type,
            occurredAt: new Date(txData.occurredAt),
            units: txData.units ? parseFloat(txData.units) : null,
            pricePerUnit: txData.pricePerUnit ? parseFloat(txData.pricePerUnit) : null,
            netAmount: txData.netAmount ? parseFloat(txData.netAmount) : null,
            fee: txData.fee ? parseFloat(txData.fee) : null,
            assetId: txData.assetId,
            accountId: txData.accountId || null,
            notes: txData.notes || null,
          },
          create: {
            id: txData.id,
            userId,
            type: txData.type,
            occurredAt: new Date(txData.occurredAt),
            units: txData.units ? parseFloat(txData.units) : null,
            pricePerUnit: txData.pricePerUnit ? parseFloat(txData.pricePerUnit) : null,
            netAmount: txData.netAmount ? parseFloat(txData.netAmount) : null,
            fee: txData.fee ? parseFloat(txData.fee) : null,
            assetId: txData.assetId,
            accountId: txData.accountId || null,
            notes: txData.notes || null,
          },
        });
      }
    }

    // 10. Holdings (recalculate after transactions)
    // Skip - will be recalculated via rebuild endpoint

    // 11. Watchlist
    if (data.watchlist && Array.isArray(data.watchlist)) {
      for (const item of data.watchlist) {
        await tx.watchlist.upsert({
          where: { id: item.id },
          update: {},
          create: {
            id: item.id,
            userId,
            assetId: item.assetId,
          },
        });
      }
    }

    // 12. Price Alerts
    if (data.priceAlerts && Array.isArray(data.priceAlerts)) {
      for (const alert of data.priceAlerts) {
        await tx.priceAlert.upsert({
          where: { id: alert.id },
          update: {
            condition: alert.condition,
            targetPrice: parseFloat(alert.targetPrice),
            isActive: alert.isActive,
            triggeredAt: alert.triggeredAt ? new Date(alert.triggeredAt) : null,
          },
          create: {
            id: alert.id,
            userId,
            assetId: alert.assetId,
            condition: alert.condition,
            targetPrice: parseFloat(alert.targetPrice),
            isActive: alert.isActive,
            triggeredAt: alert.triggeredAt ? new Date(alert.triggeredAt) : null,
          },
        });
      }
    }

    // 13. Debts
    if (data.debts && Array.isArray(data.debts)) {
      for (const debt of data.debts) {
        await tx.debt.upsert({
          where: { id: debt.id },
          update: {
            name: debt.name,
            debtType: debt.debtType,
            principalAmount: debt.principalAmount,
            currentBalance: debt.currentBalance,
            interestRate: debt.interestRate ? parseFloat(debt.interestRate) : null,
            minimumPayment: debt.minimumPayment ? parseFloat(debt.minimumPayment) : null,
            dueDate: debt.dueDate ? new Date(debt.dueDate) : null,
            isDeleted: false,
          },
          create: {
            id: debt.id,
            userId,
            name: debt.name,
            debtType: debt.debtType,
            principalAmount: debt.principalAmount,
            currentBalance: debt.currentBalance,
            interestRate: debt.interestRate ? parseFloat(debt.interestRate) : null,
            minimumPayment: debt.minimumPayment ? parseFloat(debt.minimumPayment) : null,
            dueDate: debt.dueDate ? new Date(debt.dueDate) : null,
          },
        });
      }
    }
  });

  return {
    success: true,
    message: "Backup restored successfully",
  };
}
