import { z } from "zod";
import { AccountType } from "@prisma/client";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  type: z.nativeEnum(AccountType),
  currency: z.string().min(3, "Currency must be 3 characters").max(3).default("IDR"),
  startingBalance: z.coerce.number().default(0),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  isArchived: z.boolean().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
