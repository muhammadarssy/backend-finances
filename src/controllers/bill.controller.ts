import { FastifyRequest, FastifyReply } from "fastify";
import {
  listBills,
  getBillById,
  createBill,
  updateBill,
  payBill,
  deleteBill,
} from "../services/bill.service.js";
import {
  createBillSchema,
  updateBillSchema,
  payBillSchema,
} from "../validators/bill.js";
import { sendSuccess } from "../utils/response.js";
import { BillStatus } from "@prisma/client";

export async function listBillsHandler(
  request: FastifyRequest<{
    Querystring: {
      status?: BillStatus;
      from?: string;
      to?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const filters = {
    status: request.query.status,
    from: request.query.from ? new Date(request.query.from) : undefined,
    to: request.query.to ? new Date(request.query.to) : undefined,
  };

  const bills = await listBills(userId, filters);

  return sendSuccess(reply, bills, "OK");
}

export async function getBillHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const bill = await getBillById(id, userId);

  return sendSuccess(reply, bill, "OK");
}

export async function createBillHandler(
  request: FastifyRequest<{
    Body: {
      name: string;
      amount: number;
      currency?: string;
      categoryId: string;
      accountId: string;
      dueDate: string | Date;
      reminderDays?: number[] | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const validatedData = createBillSchema.parse(request.body);

  const bill = await createBill(userId, validatedData);

  return sendSuccess(reply, bill, "Bill created successfully", 201);
}

export async function updateBillHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      name?: string;
      amount?: number;
      currency?: string;
      categoryId?: string;
      accountId?: string;
      dueDate?: string | Date;
      reminderDays?: number[] | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const validatedData = updateBillSchema.parse(request.body);

  const bill = await updateBill(id, userId, validatedData);

  return sendSuccess(reply, bill, "Bill updated successfully");
}

export async function payBillHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      paidAt: string | Date;
      amountPaid: number;
      transactionId?: string | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const validatedData = payBillSchema.parse(request.body);

  const bill = await payBill(id, userId, validatedData);

  return sendSuccess(reply, bill, "Bill payment recorded successfully");
}

export async function deleteBillHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  await deleteBill(id, userId);

  return sendSuccess(reply, null, "Bill deleted successfully");
}
