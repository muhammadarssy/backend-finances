import { z } from "zod";
import { BillStatus } from "@prisma/client";

export const createBillSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3).default("IDR"),
  categoryId: z.string(),
  accountId: z.string(),
  dueDate: z.coerce.date(),
  reminderDays: z.array(z.number().int().min(0).max(30)).optional().nullable(),
});

export const updateBillSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0").optional(),
  currency: z.string().min(3).max(3).optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  reminderDays: z.array(z.number().int().min(0).max(30)).optional().nullable(),
});

export const payBillSchema = z.object({
  paidAt: z.coerce.date(),
  amountPaid: z.coerce.number().positive("Amount must be greater than 0"),
  transactionId: z.string().optional().nullable(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type PayBillInput = z.infer<typeof payBillSchema>;
