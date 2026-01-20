import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
