import prisma from "../config/database.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../utils/errors.js";
import { CreateBillInput, UpdateBillInput, PayBillInput } from "../validators/bill.js";
import { BillStatus } from "@prisma/client";

export async function listBills(
  userId: string,
  filters: {
    status?: BillStatus;
    from?: Date;
    to?: Date;
  }
) {
  const where: any = {
    userId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.from || filters.to) {
    where.dueDate = {};
    if (filters.from) {
      where.dueDate.gte = filters.from;
    }
    if (filters.to) {
      where.dueDate.lte = filters.to;
    }
  }

  const bills = await prisma.bill.findMany({
    where,
    include: {
      category: true,
      account: true,
      payments: {
        orderBy: {
          paidAt: "desc",
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return bills;
}

export async function getBillById(billId: string, userId: string) {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: {
      category: true,
      account: true,
      payments: {
        include: {
          transaction: true,
        },
        orderBy: {
          paidAt: "desc",
        },
      },
    },
  });

  if (!bill) {
    throw new NotFoundError("Bill not found");
  }

  if (bill.userId !== userId) {
    throw new ForbiddenError("You don't have access to this bill");
  }

  return bill;
}

export async function createBill(userId: string, data: CreateBillInput) {
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

  // Create bill
  const bill = await prisma.bill.create({
    data: {
      userId,
      name: data.name,
      amount: data.amount,
      currency: data.currency,
      categoryId: data.categoryId,
      accountId: data.accountId,
      dueDate: data.dueDate,
      reminderDays: data.reminderDays || null,
      status: BillStatus.UNPAID,
    },
    include: {
      category: true,
      account: true,
    },
  });

  return bill;
}

export async function updateBill(billId: string, userId: string, data: UpdateBillInput) {
  // Verify ownership
  const existingBill = await getBillById(billId, userId);

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

  // Update bill
  const bill = await prisma.bill.update({
    where: { id: billId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.amount && { amount: data.amount }),
      ...(data.currency && { currency: data.currency }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.accountId && { accountId: data.accountId }),
      ...(data.dueDate && { dueDate: data.dueDate }),
      ...(data.reminderDays !== undefined && { reminderDays: data.reminderDays }),
    },
    include: {
      category: true,
      account: true,
      payments: true,
    },
  });

  return bill;
}

export async function payBill(billId: string, userId: string, data: PayBillInput) {
  // Verify ownership
  const bill = await getBillById(billId, userId);

  // Verify transaction if provided
  if (data.transactionId) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
    });

    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenError("You don't have access to this transaction");
    }
  }

  // Create payment and update bill status
  const result = await prisma.$transaction(async tx => {
    // Create payment
    const payment = await tx.billPayment.create({
      data: {
        billId: bill.id,
        transactionId: data.transactionId || null,
        paidAt: data.paidAt,
        amountPaid: data.amountPaid,
      },
    });

    // Calculate total paid
    const totalPaid = await tx.billPayment.aggregate({
      where: { billId: bill.id },
      _sum: {
        amountPaid: true,
      },
    });

    const totalPaidAmount = Number(totalPaid._sum.amountPaid || 0);

    // Update bill status if fully paid
    const newStatus = totalPaidAmount >= Number(bill.amount) ? BillStatus.PAID : BillStatus.UNPAID;

    await tx.bill.update({
      where: { id: bill.id },
      data: {
        status: newStatus,
      },
    });

    return { payment, newStatus };
  });

  // Fetch updated bill
  return getBillById(billId, userId);
}

export async function deleteBill(billId: string, userId: string) {
  // Verify ownership
  await getBillById(billId, userId);

  // Delete bill (cascade will delete BillPayment)
  await prisma.bill.delete({
    where: { id: billId },
  });

  return { success: true };
}
