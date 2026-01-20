import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  defaultCurrency: z.string().min(3, "Currency must be 3 characters").max(3).optional(),
  timezone: z.string().min(1, "Timezone is required").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
