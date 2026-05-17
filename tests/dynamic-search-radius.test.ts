import { getBoundingBox } from "../lib/radius";

describe("Dynamic Search Radius calculations", () => {
  it("should calculate correct bounding box with the default 3km radius", () => {
    const coords = getBoundingBox(23.9, 91.2, 3);
    expect(coords.minLat).toBeCloseTo(23.873, 5);
    expect(coords.maxLat).toBeCloseTo(23.927, 5);
    expect(coords.minLng).toBeCloseTo(91.173, 5);
    expect(coords.maxLng).toBeCloseTo(91.227, 5);
  });

  it("should calculate correct bounding box with custom 5km radius", () => {
    const coords = getBoundingBox(23.9, 91.2, 5);
    expect(coords.minLat).toBeCloseTo(23.855, 5);
    expect(coords.maxLat).toBeCloseTo(23.945, 5);
    expect(coords.minLng).toBeCloseTo(91.155, 5);
    expect(coords.maxLng).toBeCloseTo(91.245, 5);
  });
});
