const City = require("../../models/citySchema");

describe("citySchema", () => {
  test("supports legacy cities without optional metadata", async () => {
    const city = new City({
      cityName: "Bengaluru",
      state: "Karnataka",
      country: "India",
    });

    await expect(city.validate()).resolves.toBeUndefined();
  });

  test("normalizes cityCode to uppercase", async () => {
    const city = new City({
      cityCode: " blr ",
      cityName: "Bengaluru",
      state: "Karnataka",
      country: "India",
    });

    await city.validate();

    expect(city.cityCode).toBe("BLR");
  });

  test("rejects invalid tier values", async () => {
    const city = new City({
      cityName: "Bengaluru",
      state: "Karnataka",
      country: "India",
      tier: "METRO",
    });

    await expect(city.validate()).rejects.toThrow(/`METRO` is not a valid enum value/);
  });

  test("validates GeoJSON coordinate order and ranges", async () => {
    const city = new City({
      cityCode: "BLR",
      cityName: "Bengaluru",
      state: "Karnataka",
      country: "India",
      tier: "TIER_1",
      location: {
        type: "Point",
        coordinates: [77.5946, 12.9716],
      },
    });

    await expect(city.validate()).resolves.toBeUndefined();
  });

  test("rejects out-of-range GeoJSON coordinates", async () => {
    const city = new City({
      cityName: "Bengaluru",
      state: "Karnataka",
      country: "India",
      location: {
        type: "Point",
        coordinates: [77.5946, 120],
      },
    });

    await expect(city.validate()).rejects.toThrow(/Coordinates must be/);
  });

  test("defines unique cityCode and 2dsphere location indexes", () => {
    const indexes = City.schema.indexes();

    expect(indexes).toContainEqual([
      { cityCode: 1 },
      expect.objectContaining({ unique: true, sparse: true }),
    ]);
    expect(indexes).toContainEqual([
      { location: "2dsphere" },
      expect.any(Object),
    ]);
  });
});
