import { z } from "zod";

export const contributedDriverSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678)"),
  address: z.string().optional().or(z.literal("")),
  nearbyBazar: z.string().min(1, "Please select a bazar/stand"),
  vehicleType: z.enum(["CNG", "TOTO"]).default("CNG"),
  contributorName: z.string().optional().nullable().or(z.literal("")),
  contributorPhone: z.string().optional().nullable().or(z.literal("")).refine(val => {
    if (!val) return true;
    return /^01[3-9]\d{8}$/.test(val);
  }, { message: "Please enter a valid 11-digit Bangladeshi mobile number" }),
  contributorPhotoUrl: z.string().optional().nullable().or(z.literal("")),
});

export type ContributedDriverInput = z.input<typeof contributedDriverSchema>;

export const contributedDriverEditSchema = z.object({
  name: z.string().min(2, "Driver name must be at least 2 characters"),
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Please enter a valid 11-digit Bangladeshi mobile number"),
  address: z.string().optional().nullable().or(z.literal("")),
  nearbyBazar: z.string().min(1, "Please select a bazar/stand"),
  vehicleType: z.enum(["CNG", "TOTO"]),
  isApproved: z.boolean(),
  contributorName: z.string().optional().nullable().or(z.literal("")),
  contributorPhone: z.string().optional().nullable().or(z.literal("")).refine(val => {
    if (!val) return true;
    return /^01[3-9]\d{8}$/.test(val);
  }, { message: "Please enter a valid 11-digit Bangladeshi mobile number" }),
  contributorPhotoUrl: z.string().optional().nullable().or(z.literal("")),
});

export type ContributedDriverEditInput = z.infer<typeof contributedDriverEditSchema>;

