import { z } from "zod";

export const driverProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  photoUrl: z.string().url("Valid photo is required").or(z.literal("")),
  address: z.string().min(5, "Address must be at least 5 characters").optional().or(z.literal("")),
  nearbyBazar: z.string().min(2, "Nearby bazar name is required").optional().or(z.literal("")),
  birthday: z.string().optional().or(z.literal("")),
  nidNumber: z.string().min(10, "NID must be at least 10 characters").optional().or(z.literal("")),
  licenseNumber: z.string().min(5, "License must be at least 5 characters").optional().or(z.literal("")),
  vehicleNumber: z.string().min(4, "Vehicle number is required").optional().or(z.literal("")),
});

export type DriverProfileInput = z.infer<typeof driverProfileSchema>;
