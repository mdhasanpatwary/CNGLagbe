export function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm * 0.009;
  const lngDelta = radiusKm * 0.009;
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}
