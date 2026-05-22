import { calculateFare } from "../lib/fare";

describe("Dynamic Platform Fee & CNG Rate Calculations", () => {
  it("should calculate correct platform fee and fare with the default 20 BDT/km rate and 5% fee", () => {
    // 10km distance = 100 base + 200 distance = 300 BDT fare
    // 5% of 300 is 15 BDT
    const result = calculateFare(10);
    expect(result.fare).toBe(300);
    expect(result.platformFee).toBe(15);
    expect(result.totalFare).toBe(315);
  });

  it("should calculate correct platform fee with custom 20% platform fee percentage and default 20 BDT/km", () => {
    // 10km distance = 100 base + 200 distance = 300 BDT fare
    // 20% of 300 is 60 BDT platform fee
    const result = calculateFare(10, 20);
    expect(result.fare).toBe(300);
    expect(result.platformFee).toBe(60);
    expect(result.totalFare).toBe(360);
  });

  it("should respect the minimum 10 BDT floor for platform fees", () => {
    // 0km distance = 100 BDT base fare
    // 5% of 100 is 5 BDT, which is lower than 10 BDT floor, should return 10 BDT
    const result = calculateFare(0, 5);
    expect(result.fare).toBe(100);
    expect(result.platformFee).toBe(10);
    expect(result.totalFare).toBe(110);
  });

  it("should calculate correct fare and platform fee when a custom perKmRate is provided", () => {
    // 10km distance, 5% fee, custom 15 BDT/km rate
    // 10km * 15 = 150 BDT distance + 100 base = 250 BDT fare
    // 5% of 250 is 12.5 BDT, rounded to 13 BDT platform fee
    const result = calculateFare(10, 5, 15);
    expect(result.fare).toBe(250);
    expect(result.platformFee).toBe(13);
    expect(result.totalFare).toBe(263);
  });
});

