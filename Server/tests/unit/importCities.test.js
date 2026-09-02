const {
  normalizeTier,
  parseCsv,
  runCityImport,
  validateAndNormalizeRecord,
} = require("../../scripts/importCities");

const logger = {
  log: jest.fn(),
  error: jest.fn(),
};

const bengaluruRecord = {
  city_id: "blr",
  city_name: "Bengaluru",
  state: "Karnataka",
  tier: "Tier 1",
  latitude: "12.9716",
  longitude: "77.5946"
};

describe("importCities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("normalizes source tier labels", () => {
    expect(normalizeTier("Tier 1")).toBe("TIER_1");
    expect(normalizeTier("Tier 2")).toBe("TIER_2");
    expect(normalizeTier("Tier 3")).toBe("TIER_3");
  });

  test("maps dataset fields to City metadata", () => {
    const result = validateAndNormalizeRecord(bengaluruRecord, 1);

    expect(result.errors).toEqual([]);
    expect(result.city).toEqual({
      cityCode: "BLR",
      cityName: "Bengaluru",
      state: "Karnataka",
      country: "India",
      tier: "TIER_1",
      location: {
        type: "Point",
        coordinates: [77.5946, 12.9716],
      },
      isActive: true,
    });
  });

  test("detects malformed city codes such as invalid Guwahati ids", () => {
    const result = validateAndNormalizeRecord({
      ...bengaluruRecord,
      city_id: "GUW-1",
      city_name: "Guwahati",
    }, 1);

    expect(result.errors).toContain("invalid city_id format");
  });

  test("detects invalid coordinates and tier values", () => {
    const result = validateAndNormalizeRecord({
      ...bengaluruRecord,
      tier: "Metro",
      latitude: "100",
      longitude: "200",
    }, 1);

    expect(result.errors).toEqual(expect.arrayContaining([
      "invalid tier",
      "invalid latitude",
      "invalid longitude",
    ]));
  });

  test("parses CSV city records", () => {
    const records = parseCsv("city_id,city_name,state,tier,latitude,longitude\nBLR,Bengaluru,Karnataka,Tier 1,12.9716,77.5946");

    expect(records).toEqual([{
      city_id: "BLR",
      city_name: "Bengaluru",
      state: "Karnataka",
      tier: "Tier 1",
      latitude: "12.9716",
      longitude: "77.5946"
    }]);
  });

  test("dry-run validates records without writes", async () => {
    const City = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      updateOne: jest.fn(),
    };

    const summary = await runCityImport({
      records: [bengaluruRecord],
      City,
      applyChanges: false,
      logger,
    });

    expect(City.create).not.toHaveBeenCalled();
    expect(City.updateOne).not.toHaveBeenCalled();
    expect(summary).toMatchObject({
      inserted: 1,
      updated: 0,
      reused: 0,
      invalid: 0,
    });
  });

  test("detects duplicate city codes and duplicate city identities in seed data", async () => {
    const City = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      updateOne: jest.fn(),
    };

    const summary = await runCityImport({
      records: [
        bengaluruRecord,
        { ...bengaluruRecord, city_name: "Bangalore" },
        { ...bengaluruRecord, city_id: "BNG" },
      ],
      City,
      applyChanges: false,
      logger,
    });

    expect(summary.invalid).toBe(2);
    expect(summary.invalidRecords.flatMap((record) => record.errors)).toEqual(expect.arrayContaining([
      "duplicate city_id in import file",
      "duplicate city/state/country in import file",
    ]));
  });

  test("apply mode inserts new city records", async () => {
    const City = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ _id: "city-1" }),
      updateOne: jest.fn(),
    };

    const summary = await runCityImport({
      records: [bengaluruRecord],
      City,
      applyChanges: true,
      logger,
    });

    expect(City.create).toHaveBeenCalledWith(expect.objectContaining({
      cityCode: "BLR",
      cityName: "Bengaluru",
    }));
    expect(summary.inserted).toBe(1);
  });

  test("idempotent import reuses complete existing city records", async () => {
    const City = {
      findOne: jest.fn().mockResolvedValue({
        _id: "city-1",
        cityCode: "BLR",
        cityName: "Bengaluru",
        state: "Karnataka",
        country: "India",
        tier: "TIER_1",
        location: {
          type: "Point",
          coordinates: [77.5946, 12.9716],
        },
      }),
      create: jest.fn(),
      updateOne: jest.fn(),
    };

    const summary = await runCityImport({
      records: [bengaluruRecord],
      City,
      applyChanges: true,
      logger,
    });

    expect(City.create).not.toHaveBeenCalled();
    expect(City.updateOne).not.toHaveBeenCalled();
    expect(summary.reused).toBe(1);
  });

  test("updates only missing optional metadata for existing legacy cities", async () => {
    const City = {
      findOne: jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          _id: "city-1",
          cityName: "Bengaluru",
          state: "Karnataka",
          country: "India",
        }),
      create: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    const summary = await runCityImport({
      records: [bengaluruRecord],
      City,
      applyChanges: true,
      logger,
    });

    expect(City.updateOne).toHaveBeenCalledWith(
      { _id: "city-1" },
      {
        $set: {
          cityCode: "BLR",
          tier: "TIER_1",
          location: {
            type: "Point",
            coordinates: [77.5946, 12.9716],
          },
        },
      },
      { runValidators: true }
    );
    expect(summary.updated).toBe(1);
  });
});
