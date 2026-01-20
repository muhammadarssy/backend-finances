import { z } from "zod";
import { InvestmentTransactionType } from "@prisma/client";

export const createInvestmentTransactionSchema = z
  .object({
    assetId: z.string(),
    type: z.nativeEnum(InvestmentTransactionType),
    occurredAt: z.coerce.date(),
    note: z.string().optional().nullable(),
    cashAccountId: z.string().optional().nullable(),
    // BUY/SELL fields
    units: z.coerce.number().positive().optional(),
    pricePerUnit: z.coerce.number().positive().optional(),
    grossAmount: z.coerce.number().positive().optional(),
    feeAmount: z.coerce.number().min(0).default(0),
    taxAmount: z.coerce.number().min(0).default(0),
    // Other types field
    netAmount: z.coerce.number().positive().optional(),
  })
  .refine(
    data => {
      if (data.type === "BUY" || data.type === "SELL") {
        return data.units !== undefined && data.pricePerUnit !== undefined;
      }
      return true;
    },
    {
      message: "units and pricePerUnit are required for BUY/SELL transactions",
      path: ["units"],
    }
  )
  .refine(
    data => {
      if (data.type === "DIVIDEND" || data.type === "FEE" || data.type === "DEPOSIT" || data.type === "WITHDRAW") {
        return data.netAmount !== undefined;
      }
      return true;
    },
    {
      message: "netAmount is required for DIVIDEND/FEE/DEPOSIT/WITHDRAW transactions",
      path: ["netAmount"],
    }
  );

export const updateInvestmentTransactionSchema = z.object({
  assetId: z.string().optional(),
  type: z.nativeEnum(InvestmentTransactionType).optional(),
  units: z.coerce.number().positive().optional().nullable(),
  pricePerUnit: z.coerce.number().positive().optional().nullable(),
  grossAmount: z.coerce.number().positive().optional().nullable(),
  feeAmount: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  netAmount: z.coerce.number().positive().optional(),
  occurredAt: z.coerce.date().optional(),
  note: z.string().optional().nullable(),
  cashAccountId: z.string().optional().nullable(),
});

export type CreateInvestmentTransactionInput = z.infer<typeof createInvestmentTransactionSchema>;
export type UpdateInvestmentTransactionInput = z.infer<typeof updateInvestmentTransactionSchema>;
