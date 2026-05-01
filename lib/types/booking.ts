export type BookingStatus = 
  | "PENDING" 
  | "ACCEPTED" 
  | "STARTED" 
  | "COMPLETED" 
  | "CANCELLED" 
  | "TIMED_OUT";

export type RideUiState = 
  | "FINDING_DRIVER" 
  | "DRIVER_ASSIGNED" 
  | "RIDE_STARTED" 
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
}
