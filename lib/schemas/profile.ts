import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  photoUrl: z.string().url("Valid photo is required").or(z.literal("")),
  birthday: z.string().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
