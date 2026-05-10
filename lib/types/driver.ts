import { User } from "./user";
import { Booking } from "./booking";

export interface DriverStats {
  todayEarnings: number;
  todayBookings: number;
}

export interface DriverSyncData {
  authenticated: boolean;
  role: string;
  timestamp: number;
  driver: User;
  stats: DriverStats;
  currentBooking: Booking | null;
  requests: (Booking & { calculatedDistance: number })[];
}
