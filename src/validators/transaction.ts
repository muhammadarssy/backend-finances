import { z } from "zod";
import { TransactionType } from "@prisma/client";

export const createTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3).default("IDR"),
  occurredAt: z.coerce.date(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  note: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  receiptUrl: z.string().url().optional().nullable(),
});

export const createTransferSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3).default("IDR"),
  occurredAt: z.coerce.date(),
  fromAccountId: z.string(),
  toAccountId: z.string(),
  note: z.string().optional(),
});

export const updateTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0").optional(),
  currency: z.string().min(3).max(3).optional(),
  occurredAt: z.coerce.date().optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  receiptUrl: z.string().url().optional().nullable(),
  fromAccountId: z.string().optional().nullable(),
  toAccountId: z.string().optional().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
