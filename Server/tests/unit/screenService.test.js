const mongoose = require("mongoose");

const THEATRE_ID = new mongoose.Types.ObjectId().toString();
const OTHER_THEATRE_ID = new mongoose.Types.ObjectId().toString();
const SCREEN_ID = new mongoose.Types.ObjectId().toString();
const PARTNER_ID = new mongoose.Types.ObjectId().toString();
const OTHER_PARTNER_ID = new mongoose.Types.ObjectId().toString();

const screenPayload = {
  theatre: THEATRE_ID,
  name: "Screen 1",
  screenNumber: 1,
  capacity: 650,
};

const req = (role = "admin", userId = PARTNER_ID) => ({
  user: { role },
  userId,
});

const selectQuery = (value) => ({
  select: jest.fn().mockResolvedValue(value),
});

const loadService = ({ theatre = { _id: THEATRE_ID, owner: PARTNER_ID, isActive: true } } = {}) => {
  jest.resetModules();

  const repository = {
    createScreen: jest.fn(),
    findById: jest.fn(),
    findActiveById: jest.fn(),
    findScreens: jest.fn(),
    findByTheatres: jest.fn(),
    findByTheatre: jest.fn(),
    findDuplicateScreenNumber: jest.fn(),
    updateScreen: jest.fn(),
    deleteScreen: jest.fn(),
  };
  const Theatre = {
    findById: jest.fn(() => selectQuery(theatre)),
    find: jest.fn(() => selectQuery([{ _id: THEATRE_ID }])),
  };
  const Show = {
    findOne: jest.fn(() => selectQuery(null)),
  };

  jest.doMock("../../repositories/screenRepository", () => repository);
  jest.doMock("../../models/theatreSchema", () => Theatre);
  jest.doMock("../../models/showSchema", () => Show);

  return {
    repository,
    Theatre,
    Show,
    service: require("../../services/screenService"),
  };
};

describe("screenService", () => {
  test("creates a Screen for an active Theatre", async () => {
    const { service, repository } = loadService();
    repository.findDuplicateScreenNumber.mockResolvedValue(null);
    repository.createScreen.mockResolvedValue({ _id: SCREEN_ID, ...screenPayload, isActive: true });

    const screen = await service.createScreen(req("admin"), screenPayload);

    expect(repository.createScreen).toHaveBeenCalledWith({
      ...screenPayload,
      isActive: true,
    });
    expect(screen._id).toBe(SCREEN_ID);
  });

  test("allows authorized partner to manage owned Theatre Screens", async () => {
    const { service, repository } = loadService();
    repository.findDuplicateScreenNumber.mockResolvedValue(null);
    repository.createScreen.mockResolvedValue({ _id: SCREEN_ID, ...screenPayload });

    await service.createScreen(req("partner", PARTNER_ID), screenPayload);

    expect(repository.createScreen).toHaveBeenCalled();
  });

  test("denies partner for another partner's Theatre", async () => {
    const { service } = loadService({
      theatre: { _id: THEATRE_ID, owner: OTHER_PARTNER_ID, isActive: true },
    });

    await expect(service.createScreen(req("partner", PARTNER_ID), screenPayload)).rejects.toMatchObject({
      statusCode: 403,
      code: "SCREEN_ACCESS_DENIED",
    });
  });

  test("denies normal users", async () => {
    const { service } = loadService();

    await expect(service.createScreen(req("user"), screenPayload)).rejects.toMatchObject({
      statusCode: 403,
      code: "SCREEN_ACCESS_DENIED",
    });
  });

  test("rejects invalid and nonexistent Theatre references", async () => {
    const { service } = loadService({ theatre: null });

    await expect(service.createScreen(req("admin"), { ...screenPayload, theatre: "bad-id" })).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_THEATRE_ID",
    });
    await expect(service.createScreen(req("admin"), screenPayload)).rejects.toMatchObject({
      statusCode: 404,
      code: "THEATRE_NOT_FOUND",
    });
  });

  test("rejects inactive Theatre for mutations", async () => {
    const { service } = loadService({
      theatre: { _id: THEATRE_ID, owner: PARTNER_ID, isActive: false },
    });

    await expect(service.createScreen(req("admin"), screenPayload)).rejects.toMatchObject({
      statusCode: 400,
      code: "INACTIVE_THEATRE",
    });
  });

  test("rejects duplicate Screen number", async () => {
    const { service, repository } = loadService();
    repository.findDuplicateScreenNumber.mockResolvedValue({ _id: SCREEN_ID });

    await expect(service.createScreen(req("admin"), screenPayload)).rejects.toMatchObject({
      statusCode: 409,
      code: "DUPLICATE_SCREEN_NUMBER",
    });
  });

  test("rejects invalid capacity and screenNumber", async () => {
    const { service } = loadService();

    await expect(service.createScreen(req("admin"), { ...screenPayload, capacity: 0 })).rejects.toMatchObject({
      statusCode: 400,
      code: "SCREEN_VALIDATION_ERROR",
    });
    await expect(service.createScreen(req("admin"), { ...screenPayload, screenNumber: 1.5 })).rejects.toMatchObject({
      statusCode: 400,
      code: "SCREEN_VALIDATION_ERROR",
    });
  });

  test("lists Screens by Theatre after ownership validation", async () => {
    const { service, repository } = loadService();
    repository.findByTheatre.mockResolvedValue([{ _id: SCREEN_ID }]);

    const screens = await service.getScreensByTheatre(req("partner", PARTNER_ID), THEATRE_ID);

    expect(repository.findByTheatre).toHaveBeenCalledWith(THEATRE_ID, {});
    expect(screens).toHaveLength(1);
  });

  test("updates Screen details with duplicate validation", async () => {
    const { service, repository } = loadService();
    repository.findById.mockResolvedValue({ _id: SCREEN_ID, ...screenPayload });
    repository.findDuplicateScreenNumber.mockResolvedValue(null);
    repository.updateScreen.mockResolvedValue({ _id: SCREEN_ID, ...screenPayload, capacity: 700 });

    const screen = await service.updateScreen(req("admin"), SCREEN_ID, { capacity: 700 });

    expect(repository.updateScreen).toHaveBeenCalledWith(SCREEN_ID, expect.objectContaining({
      capacity: 700,
      screenNumber: 1,
    }));
    expect(screen.capacity).toBe(700);
  });

  test("hard deletes unreferenced Screen", async () => {
    const { service, repository } = loadService();
    repository.findById.mockResolvedValue({ _id: SCREEN_ID, ...screenPayload });
    repository.deleteScreen.mockResolvedValue({ _id: SCREEN_ID });

    const result = await service.deleteScreen(req("admin"), SCREEN_ID);

    expect(repository.deleteScreen).toHaveBeenCalledWith(SCREEN_ID);
    expect(result.deleted).toBe(true);
  });

  test("deactivates referenced Screen instead of deleting it", async () => {
    const { service, repository, Show } = loadService();
    repository.findById.mockResolvedValue({ _id: SCREEN_ID, ...screenPayload });
    Show.findOne.mockReturnValue(selectQuery({ _id: "show-1" }));
    repository.updateScreen.mockResolvedValue({ _id: SCREEN_ID, ...screenPayload, isActive: false });

    const result = await service.deleteScreen(req("admin"), SCREEN_ID);

    expect(repository.deleteScreen).not.toHaveBeenCalled();
    expect(repository.updateScreen).toHaveBeenCalledWith(SCREEN_ID, { isActive: false });
    expect(result.isActive).toBe(false);
  });

  test("validates Screen belongs to Theatre for Shows", async () => {
    const { service, repository } = loadService();
    repository.findActiveById.mockResolvedValue({ _id: SCREEN_ID, theatre: THEATRE_ID, isActive: true });

    await expect(service.ensureActiveScreenForTheatre(req("admin"), {
      screenId: SCREEN_ID,
      theatreId: THEATRE_ID,
    })).resolves.toMatchObject({ isActive: true });
  });

  test("rejects cross-Theatre and inactive Screen references for Shows", async () => {
    const { service, repository } = loadService();
    repository.findActiveById.mockResolvedValueOnce({ _id: SCREEN_ID, theatre: OTHER_THEATRE_ID, isActive: true });

    await expect(service.ensureActiveScreenForTheatre(req("admin"), {
      screenId: SCREEN_ID,
      theatreId: THEATRE_ID,
    })).rejects.toMatchObject({
      statusCode: 400,
      code: "SCREEN_THEATRE_MISMATCH",
    });

    repository.findActiveById.mockResolvedValueOnce(null);
    await expect(service.ensureActiveScreenForTheatre(req("admin"), {
      screenId: SCREEN_ID,
      theatreId: THEATRE_ID,
    })).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_SCREEN_REFERENCE",
    });
  });
});
