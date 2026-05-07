export interface User {
  id: string;
  name: string;
  role: "USER" | "DRIVER" | "ADMIN";
  phone: string;
  photoUrl?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt?: string;
  birthday?: string | null;
  
  // Driver specific fields
  isApproved?: boolean;
  isSuspended?: boolean;
  nidNumber?: string | null;
  licenseNumber?: string | null;
  vehicleNumber?: string | null;
  address?: string | null;
  nearbyBazar?: string | null;
  isOnline?: boolean;
  
  // Admin/Stats specific
  bookingCount?: number;
}
