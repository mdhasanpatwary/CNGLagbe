// Radius of the Earth in km
const R = 6371;

/**
 * Calculates distance in kilometers between two lat/lng points using the Haversine formula.
 * 
 * WARNING: This computes the straight-line (as the crow flies) distance. 
 * DO NOT use this for passenger fare calculation as it significantly underestimates 
 * curved road driving distance. Use it ONLY for online driver proximity and searching in PostGIS.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return Number(distance.toFixed(2));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * MVP Fare Calculation Logic:
 * Base Fare: 100 BDT
 * Per KM Fare: Configurable (Default: 20 BDT)
 * Platform Fee: 5% of Fare (Min 10 BDT)
 */
export function calculateFare(distanceKm: number, platformFeePercentage: number = 5, perKmRate: number = 20) {
  const BASE_FARE = 100;

  const fare = Math.round(BASE_FARE + distanceKm * perKmRate);
  const platformFee = Math.max(10, Math.round(fare * (platformFeePercentage / 100)));
  const totalFare = fare + platformFee;

  return {
    fare,         // This is the base booking fare
    platformFee,  // Added on top
    totalFare     // Final amount passenger pays
  };
}
