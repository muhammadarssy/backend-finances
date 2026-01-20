import { z } from "zod";
import { DebtType, DebtStatus } from "@prisma/client";

export const createDebtSchema = z.object({
  type: z.nativeEnum(DebtType, {
    errorMap: () => ({ message: "Type must be DEBT or RECEIVABLE" }),
  }),
  personName: z.string().min(1, "Person name is required"),
  amountTotal: z
    .string()
    .min(1, "Total amount is required")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Total amount must be a positive number" }
    ),
  amountRemaining: z
    .string()
    .min(1, "Remaining amount is required")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0;
      },
      { message: "Remaining amount must be a non-negative number" }
    ),
  dueDate: z.string().datetime().optional().nullable(),
  interestRate: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optional
        const num = Number(val);
        return !isNaN(num) && num >= 0;
      },
      { message: "Interest rate must be a non-negative number" }
    )
    .optional()
    .nullable(),
  minimumPayment: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optional
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Minimum payment must be a positive number" }
    )
    .optional()
    .nullable(),
});

export const updateDebtSchema = z.object({
  personName: z.string().min(1).optional(),
  amountTotal: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optional
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Total amount must be a positive number" }
    )
    .optional(),
  amountRemaining: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optional
        const num = Number(val);
        return !isNaN(num) && num >= 0;
      },
      { message: "Remaining amount must be a non-negative number" }
    )
    .optional(),
  dueDate: z.string().datetime().optional().nullable(),
  interestRate: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optional
        const num = Number(val);
        return !isNaN(num) && num >= 0;
      },
      { message: "Interest rate must be a non-negative number" }
    )
    .optional()
    .nullable(),
  minimumPayment: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optional
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Minimum payment must be a positive number" }
    )
    .optional()
    .nullable(),
});

export const addDebtPaymentSchema = z.object({
  amountPaid: z
    .string()
    .min(1, "Amount paid is required")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Amount paid must be a positive number" }
    ),
  paidAt: z.string().datetime().optional(),
  transactionId: z.string().optional().nullable(),
});

export const closeDebtSchema = z.object({
  status: z.nativeEnum(DebtStatus, {
    errorMap: () => ({ message: "Status must be OPEN or CLOSED" }),
  }),
});
