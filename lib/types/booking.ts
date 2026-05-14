export type BookingStatus = 
  | "PENDING" 
  | "ACCEPTED" 
  | "PICKED_UP"
  | "COMPLETED" 
  | "CANCELLED" 
  | "TIMED_OUT";

export type BookingUiState = 
  | "FINDING_DRIVER" 
  | "DRIVER_ASSIGNED" 
  | "TRIP_IN_PROGRESS"
  | "COMPLETED" 
  | "CANCELLED"
  | "TIMED_OUT";

export interface BookingDriver {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string | null;
  vehicleNumber?: string | null;
  rating?: number;
}

export interface BookingUser {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string | null;
}

export interface Booking {
  id: string;
  userId: string;
  driverId?: string | null;
  status: BookingStatus;
  fare: number;
  distance: number;
  polyline?: string | null;
  pickupLat: number;
  pickupLng: number;
  pickupAddress?: string | null;
  destLat: number;
  destLng: number;
  destAddress?: string | null;
  createdAt: string;
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  driver?: BookingDriver | null;
  user?: BookingUser | null;
  rating?: number | null;
  feedback?: string | null;
  isSuspicious?: boolean;
  offlineFeedback?: string | null;
}
