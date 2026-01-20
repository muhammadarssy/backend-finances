import { z } from "zod";
import { CategoryType } from "@prisma/client";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  type: z.nativeEnum(CategoryType),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export const archiveCategorySchema = z.object({
  isArchived: z.boolean(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ArchiveCategoryInput = z.infer<typeof archiveCategorySchema>;
