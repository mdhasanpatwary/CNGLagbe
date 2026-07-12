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
  phoneHash?: string | null;
  
  // Driver specific fields
  isApproved?: boolean;
  isSuspended?: boolean;
  nidNumber?: string | null;
  licenseNumber?: string | null;
  vehicleNumber?: string | null;
  address?: string | null;
  nearbyBazar?: string | null;
  isOnline?: boolean;
  
  // Wallet
  wallet?: {
    balance: number;
  };
  
  // Admin/Stats specific
  contributedDriversCount?: number;
  contributedCngCount?: number;
  contributedTotoCount?: number;
  contributedAmbulanceCount?: number;
}
