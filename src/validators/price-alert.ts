import { z } from "zod";
import { PriceAlertCondition } from "@prisma/client";

export const createPriceAlertSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  condition: z.nativeEnum(PriceAlertCondition, {
    errorMap: () => ({ message: "Condition must be ABOVE or BELOW" }),
  }),
  targetPrice: z
    .string()
    .min(1, "Target price is required")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Target price must be a positive number" }
    ),
});

export const updatePriceAlertSchema = z.object({
  isActive: z.boolean().optional(),
  condition: z.nativeEnum(PriceAlertCondition).optional(),
  targetPrice: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optional
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Target price must be a positive number" }
    )
    .optional(),
});

export const deletePriceAlertSchema = z.object({
  id: z.string().min(1, "Alert ID is required"),
});
