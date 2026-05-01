export interface AdminStats {
  revenue?: {
    total: number;
    voided: number;
    commission: number;
    driverPayout: number;
  };
  activeDrivers?: number;
  bookings?: {
    pending: number;
  };
}

export interface PendingDriver {
  id: string;
  name: string;
  phone: string;
  nidNumber?: string | null;
  licenseNumber?: string | null;
  vehicleNumber?: string | null;
  createdAt: string;
}
