export interface AdminStats {
  totalBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  timedOutBookings?: number;
  pendingBookings?: number;
  acceptedBookings?: number;
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
  photoUrl?: string | null;
  isApproved: boolean;
  isSuspended?: boolean;
  createdAt: string;
  updatedAt?: string;
}

