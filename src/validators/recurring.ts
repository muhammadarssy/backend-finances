import { z } from "zod";
import { CategoryType, RecurringScheduleType } from "@prisma/client";

export const createRecurringSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  type: z.nativeEnum(CategoryType),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3).default("IDR"),
  categoryId: z.string(),
  accountId: z.string(),
  scheduleType: z.nativeEnum(RecurringScheduleType),
  scheduleValue: z.string(),
  nextRunAt: z.coerce.date(),
  isActive: z.boolean().default(true),
});

export const updateRecurringSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  type: z.nativeEnum(CategoryType).optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0").optional(),
  currency: z.string().min(3).max(3).optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  scheduleType: z.nativeEnum(RecurringScheduleType).optional(),
  scheduleValue: z.string().optional(),
  nextRunAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const toggleRecurringSchema = z.object({
  isActive: z.boolean(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
export type ToggleRecurringInput = z.infer<typeof toggleRecurringSchema>;
