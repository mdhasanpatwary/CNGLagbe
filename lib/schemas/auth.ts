import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().min(11, "Phone number must be at least 11 characters").max(14, "Phone number too long"),
  otp: z.string().nullish(),
  password: z.string().nullish(),
  newPassword: z.string().nullish(),
});


export type LoginInput = z.infer<typeof loginSchema>;

export const driverLoginSchema = z.object({
  phone: z.string().min(11, "Phone number must be at least 11 characters").max(14, "Phone number too long"),
});

export type DriverLoginInput = z.infer<typeof driverLoginSchema>;

export const driverSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(11, "Phone number must be at least 11 characters").max(14, "Phone number too long"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  nearbyBazar: z.string().min(2, "Nearby bazar name is required"),
  nidNumber: z.string().min(10, "nid-number is required (min 10 characters)"),
  licenseNumber: z.string().min(5, "License-No is required"),
  vehicleNumber: z.string().min(5, "cng plate-no is required"),
  vehicleType: z.literal("CNG"),
  photoUrl: z.string().url("Valid photo is required"),
  nidFrontUrl: z.string().url("NID Front image is required"),
  nidBackUrl: z.string().url("NID Back image is required"),
  licenseFrontUrl: z.string().url("License Front image is required"),
  licenseBackUrl: z.string().url("License Back image is required"),
});

export type DriverSignupInput = z.infer<typeof driverSignupSchema>;

export const adminLoginSchema = z.object({
  phone: z.string().min(11, "Phone number must be at least 11 characters").max(14, "Phone number too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

