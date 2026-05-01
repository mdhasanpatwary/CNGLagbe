-- Composite index for driver booking lookups
CREATE INDEX IF NOT EXISTS "Booking_driverId_status_idx" 
  ON "Booking"("driverId", "status");

-- Composite index for pending booking queries
CREATE INDEX IF NOT EXISTS "Booking_status_createdAt_idx" 
  ON "Booking"("status", "createdAt");

-- Spatial index for PostGIS proximity queries
CREATE INDEX IF NOT EXISTS "Booking_pickup_gist_idx" 
  ON "Booking" USING GIST (
    ST_MakePoint("pickupLng", "pickupLat")
  );
