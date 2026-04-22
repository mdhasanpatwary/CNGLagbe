-- Add spatial index for geospatial queries
CREATE INDEX idx_booking_pickup_geom ON "Booking" USING GIST (ST_MakePoint("pickupLng", "pickupLat"));

-- Ensure composite index on BookingRejection for efficient exclusion
-- (Already exists as unique index from schema)