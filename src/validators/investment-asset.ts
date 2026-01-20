import { z } from "zod";
import { InvestmentAssetType } from "@prisma/client";

export const createInvestmentAssetSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(50, "Symbol too long"),
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  assetType: z.nativeEnum(InvestmentAssetType),
  exchange: z.string().max(50).optional().nullable(),
  currency: z.string().min(3).max(3).default("IDR"),
});

export const updateInvestmentAssetSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(50, "Symbol too long").optional(),
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  assetType: z.nativeEnum(InvestmentAssetType).optional(),
  exchange: z.string().max(50).optional().nullable(),
  currency: z.string().min(3).max(3).optional(),
});

export type CreateInvestmentAssetInput = z.infer<typeof createInvestmentAssetSchema>;
export type UpdateInvestmentAssetInput = z.infer<typeof updateInvestmentAssetSchema>;
