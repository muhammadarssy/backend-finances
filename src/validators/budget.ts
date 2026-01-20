import { z } from "zod";

export const upsertBudgetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(3000),
  totalLimit: z.coerce.number().positive().optional().nullable(),
  items: z.array(
    z.object({
      categoryId: z.string(),
      limitAmount: z.coerce.number().positive(),
    })
  ),
});

export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;
