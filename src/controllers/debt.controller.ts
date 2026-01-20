import { FastifyRequest, FastifyReply } from "fastify";
import {
  listDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
  addDebtPayment,
  closeDebt,
} from "../services/debt.service.js";
import { sendSuccess } from "../utils/response.js";
import {
  createDebtSchema,
  updateDebtSchema,
  addDebtPaymentSchema,
  closeDebtSchema,
} from "../validators/debt.js";
import { DebtType, DebtStatus } from "@prisma/client";

export async function listDebtsHandler(
  request: FastifyRequest<{
    Querystring: {
      type?: DebtType;
      status?: DebtStatus;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const filters = {
    type: request.query.type,
    status: request.query.status,
  };

  const debts = await listDebts(userId, filters);

  return sendSuccess(reply, debts, "OK");
}

export async function getDebtHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const debt = await getDebtById(id, userId);

  return sendSuccess(reply, debt, "OK");
}

export async function createDebtHandler(
  request: FastifyRequest<{
    Body: {
      type: DebtType;
      personName: string;
      amountTotal: string;
      amountRemaining: string;
      dueDate?: string | null;
      interestRate?: string | null;
      minimumPayment?: string | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const data = request.body;

  // Validate input
  createDebtSchema.parse(data);

  const debt = await createDebt(userId, data);

  return sendSuccess(reply, debt, "Debt created successfully", 201);
}

export async function updateDebtHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      personName?: string;
      amountTotal?: string;
      amountRemaining?: string;
      dueDate?: string | null;
      interestRate?: string | null;
      minimumPayment?: string | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;
  const data = request.body;

  // Validate input
  updateDebtSchema.parse(data);

  const debt = await updateDebt(id, userId, data);

  return sendSuccess(reply, debt, "Debt updated successfully");
}

export async function deleteDebtHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  await deleteDebt(id, userId);

  return sendSuccess(reply, null, "Debt deleted successfully");
}

export async function addDebtPaymentHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      amountPaid: string;
      paidAt?: string;
      transactionId?: string | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;
  const data = request.body;

  // Validate input
  addDebtPaymentSchema.parse(data);

  const debt = await addDebtPayment(id, userId, data);

  return sendSuccess(reply, debt, "Payment recorded successfully");
}

export async function closeDebtHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      status: DebtStatus;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;
  const data = request.body;

  // Validate input
  closeDebtSchema.parse(data);

  // Only allow CLOSED status
  if (data.status !== DebtStatus.CLOSED) {
    return reply.status(400).send({
      success: false,
      message: "Status must be CLOSED",
    });
  }

  const debt = await closeDebt(id, userId);

  return sendSuccess(reply, debt, "Debt closed successfully");
}
