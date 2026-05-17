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
  offlineDrivers?: number;
  onRideDrivers?: number;
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
  vehicleType?: string | null;
  photoUrl?: string | null;
  nidFrontUrl?: string | null;
  nidBackUrl?: string | null;
  licenseFrontUrl?: string | null;
  licenseBackUrl?: string | null;
  address?: string | null;
  nearbyBazar?: string | null;
  isApproved: boolean;
  isSuspended?: boolean;
  isOnline?: boolean;
  createdAt: string;
  updatedAt?: string;
  wallet?: {
    balance: number;
  } | null;
  averageRating?: number | null;
  ratingCount?: number;
}

