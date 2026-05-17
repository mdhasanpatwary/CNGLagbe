import { calculateFare } from "../lib/fare";

describe("Dynamic Platform Fee Calculations", () => {
  it("should calculate correct platform fee with the default 5% percentage", () => {
    // 10km distance = 100 base + 150 distance = 250 BDT fare
    // 5% of 250 is 12.5, rounded to 13 BDT
    const result = calculateFare(10);
    expect(result.fare).toBe(250);
    expect(result.platformFee).toBe(13);
    expect(result.totalFare).toBe(263);
  });

  it("should calculate correct platform fee with custom 20% platform fee percentage", () => {
    // 10km distance = 250 BDT base fare
    // 20% of 250 is 50 BDT platform fee
    const result = calculateFare(10, 20);
    expect(result.fare).toBe(250);
    expect(result.platformFee).toBe(50);
    expect(result.totalFare).toBe(300);
  });

  it("should respect the minimum 10 BDT floor for platform fees", () => {
    // 0km distance = 100 BDT base fare
    // 5% of 100 is 5 BDT, which is lower than 10 BDT floor, should return 10 BDT
    const result = calculateFare(0, 5);
    expect(result.fare).toBe(100);
    expect(result.platformFee).toBe(10);
    expect(result.totalFare).toBe(110);
  });
});
