import { z } from "zod";

export const waitlistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Please enter a valid Bangladeshi mobile number (e.g., 01712345678)"),
  role: z.enum(["USER", "DRIVER"]),
  location: z.string().min(2, "Location is required"),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
