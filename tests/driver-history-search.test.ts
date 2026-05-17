import { buildDriverHistoryWhere } from "@/lib/history";

describe("buildDriverHistoryWhere", () => {
  it("should build base where clause with status, timeframe, and driverId", () => {
    const driverId = "test-driver-id";
    const result = buildDriverHistoryWhere(driverId, {
      status: "COMPLETED",
      timeframe: "all",
      search: "",
    });

    expect(result.driverId).toBe(driverId);
    expect(result.status).toBe("COMPLETED");
    expect(result.OR).toBeUndefined();
  });

  it("should build nested OR search fields when search parameter is provided", () => {
    const result = buildDriverHistoryWhere("test-driver-id", {
      status: "COMPLETED",
      timeframe: "all",
      search: "Rahim",
    });

    expect(result.OR).toBeDefined();
    expect(result.OR).toHaveLength(3);
    expect(result.OR).toContainEqual({ pickupAddress: { contains: "Rahim", mode: "insensitive" } });
    expect(result.OR).toContainEqual({ destAddress: { contains: "Rahim", mode: "insensitive" } });
    expect(result.OR).toContainEqual({
      user: {
        OR: [
          { name: { contains: "Rahim", mode: "insensitive" } },
          { phone: { contains: "Rahim", mode: "insensitive" } },
        ],
      },
    });
  });
});
