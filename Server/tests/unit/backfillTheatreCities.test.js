const { extractCityParts, findAddressAlias, runBackfill } = require("../../scripts/backfillTheatreCities");

const logger = {
  log: jest.fn(),
  error: jest.fn(),
};

describe("backfillTheatreCities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("extracts explicit legacy city fields", () => {
    expect(extractCityParts({
      cityName: " Bengaluru ",
      state: " Karnataka ",
      country: " India ",
    })).toEqual({
      status: "mappable",
      cityName: "Bengaluru",
      state: "Karnataka",
      country: "India",
    });
  });

  test("skips ambiguous records rather than guessing from address", () => {
    expect(extractCityParts({ address: "MG Road, Bengaluru" })).toEqual({ status: "ambiguous" });
  });

  test("matches Visakhapatnam address alias to VTZ", () => {
    expect(extractCityParts({ address: "Beach Road, Visakhapatnam." })).toEqual({
      status: "aliasMatched",
      alias: "Visakhapatnam",
      cityCode: "VTZ",
    });
  });

  test("matches Vizag address alias to VTZ with punctuation and casing", () => {
    expect(extractCityParts({ address: "  MVP Colony, VIZAG, Andhra Pradesh  " })).toEqual({
      status: "aliasMatched",
      alias: "Vizag",
      cityCode: "VTZ",
    });
  });

  test("does not match unsupported or embedded aliases", () => {
    expect(findAddressAlias("New Delhi")).toBeUndefined();
    expect(findAddressAlias("Notvizag Township")).toBeUndefined();
  });

  test("dry-run makes no writes", async () => {
    const Theatre = {
      find: jest.fn().mockResolvedValue([
        { _id: "theatre-1", cityName: "Bengaluru", state: "Karnataka", country: "India" },
      ]),
      updateOne: jest.fn(),
    };
    const City = { findOneAndUpdate: jest.fn() };

    const summary = await runBackfill({ Theatre, City, applyChanges: false, logger });

    expect(City.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Theatre.updateOne).not.toHaveBeenCalled();
    expect(summary).toMatchObject({
      theatresScanned: 1,
      citiesDiscovered: 1,
      theatresUpdated: 0,
    });
  });

  test("dry-run resolves VTZ alias and prints proposed mapping without writes", async () => {
    const Theatre = {
      find: jest.fn().mockResolvedValue([
        { _id: "theatre-1", name: "Jagadamba", address: "Vizag, Andhra Pradesh" },
      ]),
      updateOne: jest.fn(),
    };
    const City = {
      findOne: jest.fn().mockResolvedValue({
        _id: "city-vtz",
        cityName: "Visakhapatnam",
        cityCode: "VTZ",
      }),
    };

    const summary = await runBackfill({ Theatre, City, applyChanges: false, logger });

    expect(City.findOne).toHaveBeenCalledWith({ cityCode: "VTZ" });
    expect(Theatre.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Theatre: Jagadamba");
    expect(logger.log).toHaveBeenCalledWith("Matched alias: Vizag");
    expect(logger.log).toHaveBeenCalledWith("Target City: Visakhapatnam (VTZ)");
    expect(logger.log).toHaveBeenCalledWith("Action: WOULD UPDATE");
    expect(summary).toMatchObject({
      citiesDiscovered: 1,
      theatresUpdated: 0,
    });
  });

  test("apply mode assigns VTZ city without creating another city", async () => {
    const Theatre = {
      find: jest.fn().mockResolvedValue([
        { _id: "theatre-1", name: "Melody", address: "Visakhapatnam" },
      ]),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const City = {
      findOne: jest.fn().mockResolvedValue({
        _id: "city-vtz",
        cityName: "Visakhapatnam",
        cityCode: "VTZ",
      }),
      findOneAndUpdate: jest.fn(),
    };

    const summary = await runBackfill({ Theatre, City, applyChanges: true, logger });

    expect(City.findOne).toHaveBeenCalledWith({ cityCode: "VTZ" });
    expect(City.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Theatre.updateOne).toHaveBeenCalledWith(
      { _id: "theatre-1", city: { $exists: false } },
      { $set: { city: "city-vtz" } }
    );
    expect(summary.theatresUpdated).toBe(1);
  });

  test("skips safely when VTZ city is missing", async () => {
    const Theatre = {
      find: jest.fn().mockResolvedValue([
        { _id: "theatre-1", name: "Missing City Theatre", address: "Vizag" },
      ]),
      updateOne: jest.fn(),
    };
    const City = {
      findOne: jest.fn().mockResolvedValue(null),
      findOneAndUpdate: jest.fn(),
    };

    const summary = await runBackfill({ Theatre, City, applyChanges: true, logger });

    expect(City.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Theatre.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Target City: VTZ not found");
    expect(logger.log).toHaveBeenCalledWith("Action: SKIP");
    expect(summary.missingCitySkipped).toBe(1);
  });

  test("unknown city address is skipped", async () => {
    const Theatre = {
      find: jest.fn().mockResolvedValue([
        { _id: "theatre-1", name: "Unknown", address: "Hyderabad" },
      ]),
      updateOne: jest.fn(),
    };
    const City = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const summary = await runBackfill({ Theatre, City, applyChanges: true, logger });

    expect(City.findOne).not.toHaveBeenCalled();
    expect(City.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Theatre.updateOne).not.toHaveBeenCalled();
    expect(summary.ambiguousSkipped).toBe(1);
  });

  test("apply mode reuses city upsert and only updates unmigrated theatres", async () => {
    const Theatre = {
      find: jest.fn().mockResolvedValue([
        { _id: "theatre-1", cityName: "Bengaluru", state: "Karnataka", country: "India" },
      ]),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const City = {
      findOneAndUpdate: jest.fn().mockResolvedValue({
        _id: "city-1",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-02T00:00:00Z"),
      }),
    };

    const summary = await runBackfill({ Theatre, City, applyChanges: true, logger });

    expect(City.findOneAndUpdate).toHaveBeenCalledWith(
      { cityName: "Bengaluru", state: "Karnataka", country: "India" },
      { $setOnInsert: { cityName: "Bengaluru", state: "Karnataka", country: "India", isActive: true } },
      expect.objectContaining({ upsert: true })
    );
    expect(Theatre.updateOne).toHaveBeenCalledWith(
      { _id: "theatre-1", city: { $exists: false } },
      { $set: { city: "city-1" } }
    );
    expect(summary.theatresUpdated).toBe(1);
  });

  test("repeated migration treats already mapped theatres as migrated", async () => {
    const Theatre = {
      find: jest.fn().mockResolvedValue([{ _id: "theatre-1", city: "city-1" }]),
      updateOne: jest.fn(),
    };
    const City = { findOneAndUpdate: jest.fn() };

    const summary = await runBackfill({ Theatre, City, applyChanges: true, logger });

    expect(summary.alreadyMigrated).toBe(1);
    expect(City.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Theatre.updateOne).not.toHaveBeenCalled();
  });

  test("repeated apply is idempotent when alias theatre was already updated", async () => {
    const Theatre = {
      find: jest.fn().mockResolvedValue([
        { _id: "theatre-1", name: "Jagadamba", address: "Vizag", city: "city-vtz" },
      ]),
      updateOne: jest.fn(),
    };
    const City = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const summary = await runBackfill({ Theatre, City, applyChanges: true, logger });

    expect(summary.alreadyMigrated).toBe(1);
    expect(City.findOne).not.toHaveBeenCalled();
    expect(City.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Theatre.updateOne).not.toHaveBeenCalled();
  });
});
