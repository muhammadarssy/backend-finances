import prisma from "../config/database.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/errors.js";
import { DebtType, DebtStatus } from "@prisma/client";

export async function listDebts(
  userId: string,
  filters: {
    type?: DebtType;
    status?: DebtStatus;
  }
) {
  const where: any = {
    userId,
  };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const debts = await prisma.debt.findMany({
    where,
    include: {
      payments: {
        orderBy: {
          paidAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return debts;
}

export async function getDebtById(debtId: string, userId: string) {
  const debt = await prisma.debt.findUnique({
    where: { id: debtId },
    include: {
      payments: {
        orderBy: {
          paidAt: "desc",
        },
      },
    },
  });

  if (!debt) {
    throw new NotFoundError("Debt not found");
  }

  if (debt.userId !== userId) {
    throw new ForbiddenError("You don't have access to this debt");
  }

  return debt;
}

export async function createDebt(
  userId: string,
  data: {
    type: DebtType;
    personName: string;
    amountTotal: string;
    amountRemaining: string;
    dueDate?: string | null;
    interestRate?: string | null;
    minimumPayment?: string | null;
  }
) {
  // Validate amounts
  const amountTotal = Number(data.amountTotal);
  const amountRemaining = Number(data.amountRemaining);

  if (amountRemaining > amountTotal) {
    throw new ValidationError("Remaining amount cannot exceed total amount");
  }

  const debt = await prisma.debt.create({
    data: {
      userId,
      type: data.type,
      personName: data.personName,
      amountTotal: amountTotal,
      amountRemaining: amountRemaining,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      interestRate: data.interestRate ? Number(data.interestRate) : null,
      minimumPayment: data.minimumPayment ? Number(data.minimumPayment) : null,
      status: amountRemaining <= 0 ? DebtStatus.CLOSED : DebtStatus.OPEN,
    },
    include: {
      payments: true,
    },
  });

  return debt;
}

export async function updateDebt(
  debtId: string,
  userId: string,
  data: {
    personName?: string;
    amountTotal?: string;
    amountRemaining?: string;
    dueDate?: string | null;
    interestRate?: string | null;
    minimumPayment?: string | null;
  }
) {
  // Verify ownership
  const existingDebt = await prisma.debt.findUnique({
    where: { id: debtId },
  });

  if (!existingDebt) {
    throw new NotFoundError("Debt not found");
  }

  if (existingDebt.userId !== userId) {
    throw new ForbiddenError("You don't have access to this debt");
  }

  // Prepare update data
  const updateData: any = {};

  if (data.personName !== undefined) {
    updateData.personName = data.personName;
  }

  if (data.amountTotal !== undefined) {
    updateData.amountTotal = Number(data.amountTotal);
  }

  if (data.amountRemaining !== undefined) {
    updateData.amountRemaining = Number(data.amountRemaining);
  }

  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }

  if (data.interestRate !== undefined) {
    updateData.interestRate = data.interestRate ? Number(data.interestRate) : null;
  }

  if (data.minimumPayment !== undefined) {
    updateData.minimumPayment = data.minimumPayment ? Number(data.minimumPayment) : null;
  }

  // Validate amounts if both are being updated
  if (updateData.amountTotal !== undefined && updateData.amountRemaining !== undefined) {
    if (updateData.amountRemaining > updateData.amountTotal) {
      throw new ValidationError("Remaining amount cannot exceed total amount");
    }
  } else if (updateData.amountTotal !== undefined) {
    if (Number(existingDebt.amountRemaining) > updateData.amountTotal) {
      throw new ValidationError("Remaining amount cannot exceed total amount");
    }
  } else if (updateData.amountRemaining !== undefined) {
    if (updateData.amountRemaining > Number(existingDebt.amountTotal)) {
      throw new ValidationError("Remaining amount cannot exceed total amount");
    }
  }

  // Update status based on remaining amount
  const finalRemaining =
    updateData.amountRemaining !== undefined
      ? updateData.amountRemaining
      : Number(existingDebt.amountRemaining);

  updateData.status = finalRemaining <= 0 ? DebtStatus.CLOSED : DebtStatus.OPEN;

  const debt = await prisma.debt.update({
    where: { id: debtId },
    data: updateData,
    include: {
      payments: {
        orderBy: {
          paidAt: "desc",
        },
      },
    },
  });

  return debt;
}

export async function deleteDebt(debtId: string, userId: string) {
  // Verify ownership
  const debt = await prisma.debt.findUnique({
    where: { id: debtId },
  });

  if (!debt) {
    throw new NotFoundError("Debt not found");
  }

  if (debt.userId !== userId) {
    throw new ForbiddenError("You don't have access to this debt");
  }

  // Hard delete (cascade will delete payments)
  await prisma.debt.delete({
    where: { id: debtId },
  });

  return { success: true };
}

export async function addDebtPayment(
  debtId: string,
  userId: string,
  data: {
    amountPaid: string;
    paidAt?: string;
    transactionId?: string | null;
  }
) {
  // Verify ownership
  const debt = await prisma.debt.findUnique({
    where: { id: debtId },
  });

  if (!debt) {
    throw new NotFoundError("Debt not found");
  }

  if (debt.userId !== userId) {
    throw new ForbiddenError("You don't have access to this debt");
  }

  if (debt.status === DebtStatus.CLOSED) {
    throw new ValidationError("Cannot add payment to closed debt");
  }

  const amountPaid = Number(data.amountPaid);
  const currentRemaining = Number(debt.amountRemaining);

  if (amountPaid > currentRemaining) {
    throw new ValidationError("Payment amount cannot exceed remaining amount");
  }

  // Verify transaction exists if provided
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

  // Create payment and update debt in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create payment
    const payment = await tx.debtPayment.create({
      data: {
        debtId,
        amountPaid: amountPaid,
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
        transactionId: data.transactionId || null,
      },
    });

    // Update debt
    const newRemaining = currentRemaining - amountPaid;
    const updatedDebt = await tx.debt.update({
      where: { id: debtId },
      data: {
        amountRemaining: newRemaining,
        status: newRemaining <= 0 ? DebtStatus.CLOSED : DebtStatus.OPEN,
      },
      include: {
        payments: {
          orderBy: {
            paidAt: "desc",
          },
        },
      },
    });

    return updatedDebt;
  });

  return result;
}

export async function closeDebt(debtId: string, userId: string) {
  // Verify ownership
  const debt = await prisma.debt.findUnique({
    where: { id: debtId },
  });

  if (!debt) {
    throw new NotFoundError("Debt not found");
  }

  if (debt.userId !== userId) {
    throw new ForbiddenError("You don't have access to this debt");
  }

  const updatedDebt = await prisma.debt.update({
    where: { id: debtId },
    data: {
      status: DebtStatus.CLOSED,
    },
    include: {
      payments: {
        orderBy: {
          paidAt: "desc",
        },
      },
    },
  });

  return updatedDebt;
}
