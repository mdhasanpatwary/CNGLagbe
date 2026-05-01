import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().min(11, "Phone number must be at least 11 characters").max(14, "Phone number too long"),
  otp: z.string().min(4, "OTP must be 4 digits").max(6, "OTP too long").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const driverLoginSchema = z.object({
  phone: z.string().min(11, "Phone number must be at least 11 characters").max(14, "Phone number too long"),
});

export type DriverLoginInput = z.infer<typeof driverLoginSchema>;

export const driverSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(11, "Phone number must be at least 11 characters").max(14, "Phone number too long"),
  nidNumber: z.string().min(10, "NID must be at least 10 characters").optional().or(z.literal("")),
  licenseNumber: z.string().optional().or(z.literal("")),
  vehicleNumber: z.string().min(5, "Vehicle number is required"),
  vehicleType: z.enum(["CNG", "Electric"]),
  photoUrl: z.string().url("Valid photo is required").or(z.literal("")),
});

export type DriverSignupInput = z.infer<typeof driverSignupSchema>;

export const adminLoginSchema = z.object({
  phone: z.string().min(11, "Phone number must be at least 11 characters").max(14, "Phone number too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

