const mongoose = require("mongoose");

const loadService = () => {
  jest.resetModules();

  const repository = {
    createCity: jest.fn(),
    findById: jest.fn(),
    findActiveById: jest.fn(),
    findDuplicate: jest.fn(),
    findCities: jest.fn(),
    updateCity: jest.fn(),
  };

  jest.doMock("../../repositories/cityRepository", () => repository);

  return {
    repository,
    service: require("../../services/cityService"),
  };
};

describe("cityService", () => {
  const CITY_ID = new mongoose.Types.ObjectId().toString();
  const cityPayload = {
    cityName: "Bengaluru",
    state: "Karnataka",
    country: "India",
  };

  test("creates a city with trimmed required fields", async () => {
    const { service, repository } = loadService();
    repository.findDuplicate.mockResolvedValue(null);
    repository.createCity.mockResolvedValue({ _id: CITY_ID, ...cityPayload, isActive: true });

    const city = await service.createCity({
      cityName: " Bengaluru ",
      state: " Karnataka ",
      country: " India ",
    });

    expect(repository.createCity).toHaveBeenCalledWith({
      cityCode: undefined,
      cityName: "Bengaluru",
      state: "Karnataka",
      country: "India",
      isActive: undefined,
      tier: undefined,
      location: undefined,
    });
    expect(city.cityName).toBe("Bengaluru");
  });

  test("normalizes city code before creation", async () => {
    const { service, repository } = loadService();
    repository.findDuplicate.mockResolvedValue(null);
    repository.createCity.mockResolvedValue({ _id: CITY_ID, ...cityPayload, cityCode: "BLR" });

    await service.createCity({
      ...cityPayload,
      cityCode: " blr ",
    });

    expect(repository.createCity).toHaveBeenCalledWith(expect.objectContaining({
      cityCode: "BLR",
    }));
  });

  test("rejects duplicate city code", async () => {
    const { service, repository } = loadService();
    repository.findDuplicate.mockResolvedValue({ _id: CITY_ID, cityCode: "BLR" });

    await expect(service.createCity({ ...cityPayload, cityCode: "BLR" })).rejects.toMatchObject({
      statusCode: 409,
      code: "DUPLICATE_CITY_CODE",
    });
  });

  test("rejects invalid city tier", async () => {
    const { service, repository } = loadService();
    repository.findDuplicate.mockResolvedValue(null);

    await expect(service.createCity({ ...cityPayload, tier: "METRO" })).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_CITY_TIER",
    });
  });

  test("rejects invalid GeoJSON coordinates", async () => {
    const { service, repository } = loadService();
    repository.findDuplicate.mockResolvedValue(null);

    await expect(service.createCity({
      ...cityPayload,
      location: {
        type: "Point",
        coordinates: [200, 12.97],
      },
    })).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_CITY_LOCATION",
    });
  });

  test("rejects duplicate cities", async () => {
    const { service, repository } = loadService();
    repository.findDuplicate.mockResolvedValue({ _id: CITY_ID });

    await expect(service.createCity(cityPayload)).rejects.toMatchObject({
      statusCode: 409,
      code: "DUPLICATE_CITY",
    });
  });

  test("lists active cities by default", async () => {
    const { service, repository } = loadService();
    repository.findCities.mockResolvedValue([{ _id: CITY_ID, ...cityPayload }]);

    const cities = await service.getCities();

    expect(repository.findCities).toHaveBeenCalledWith({ includeInactive: false });
    expect(cities).toHaveLength(1);
  });

  test("gets city by valid id", async () => {
    const { service, repository } = loadService();
    repository.findById.mockResolvedValue({ _id: CITY_ID, ...cityPayload });

    await expect(service.getCityById(CITY_ID)).resolves.toMatchObject(cityPayload);
  });

  test("rejects invalid city id", async () => {
    const { service } = loadService();

    await expect(service.getCityById("not-an-id")).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_CITY_ID",
    });
  });

  test("updates city details", async () => {
    const { service, repository } = loadService();
    repository.findById.mockResolvedValue({ _id: CITY_ID, ...cityPayload, isActive: true });
    repository.findDuplicate.mockResolvedValue(null);
    repository.updateCity.mockResolvedValue({ _id: CITY_ID, ...cityPayload, state: "KA", isActive: true });

    const city = await service.updateCity(CITY_ID, { state: "KA" });

    expect(repository.updateCity).toHaveBeenCalledWith(CITY_ID, {
      cityCode: undefined,
      cityName: "Bengaluru",
      state: "KA",
      country: "India",
      isActive: true,
      tier: undefined,
      location: undefined,
    });
    expect(city.state).toBe("KA");
  });

  test("keeps legacy city compatibility when optional metadata is missing", async () => {
    const { service, repository } = loadService();
    repository.findById.mockResolvedValue({ _id: CITY_ID, ...cityPayload, isActive: true });
    repository.findDuplicate.mockResolvedValue(null);
    repository.updateCity.mockResolvedValue({ _id: CITY_ID, ...cityPayload, isActive: true });

    await expect(service.updateCity(CITY_ID, { cityName: "Bengaluru" })).resolves.toMatchObject(cityPayload);
  });

  test("deactivates a city instead of deleting it", async () => {
    const { service, repository } = loadService();
    repository.updateCity.mockResolvedValue({ _id: CITY_ID, ...cityPayload, isActive: false });

    const city = await service.deactivateCity(CITY_ID);

    expect(repository.updateCity).toHaveBeenCalledWith(CITY_ID, { isActive: false });
    expect(city.isActive).toBe(false);
  });

  test("validates active city references for theatres", async () => {
    const { service, repository } = loadService();
    repository.findActiveById.mockResolvedValue({ _id: CITY_ID, ...cityPayload, isActive: true });

    await expect(service.ensureActiveCity(CITY_ID)).resolves.toMatchObject({ isActive: true });
  });

  test("rejects inactive or missing city references", async () => {
    const { service, repository } = loadService();
    repository.findActiveById.mockResolvedValue(null);

    await expect(service.ensureActiveCity(CITY_ID)).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_CITY_REFERENCE",
    });
  });
});
