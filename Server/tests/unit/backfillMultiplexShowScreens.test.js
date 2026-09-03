const {
  getDocumentId,
  normalizeShowTime,
  runMultiplexShowScreenBackfill,
} = require("../../scripts/backfillMultiplexShowScreens");

const JAGADAMBA_ID = "680d2810b620f83a364be538";
const INOX_ID = "69676c4e2cc6373df7484212";
const SINGLE_SCREEN_THEATRE_ID = "680d0b24dc0716a3459f2ca2";
const JAGADAMBA_SCREEN_1 = "6a9890cd3917c3c0d62f96c1";
const JAGADAMBA_SCREEN_2 = "6a9891133917c3c0d62f96c2";
const INOX_SCREEN_3 = "6a9893a33917c3c0d62f96c7";
const OTHER_SCREEN = "other-screen";

const screenAssignments = {
  [JAGADAMBA_ID]: {
    "10:30": JAGADAMBA_SCREEN_1,
    "14:30": JAGADAMBA_SCREEN_2,
  },
  [INOX_ID]: {
    "18:30": INOX_SCREEN_3,
  },
};

const logger = {
  log: jest.fn(),
  error: jest.fn(),
};

const show = (overrides = {}) => ({
  _id: "show-1",
  name: "Morning Show",
  theatre: {
    _id: JAGADAMBA_ID,
    name: "Jagadamba Complex A/C 4K Dolby Atmos : Vizag",
  },
  movie: "movie-1",
  date: "2026-09-03",
  time: "10:30",
  ticketPrice: 200,
  totalSeats: 1016,
  bookedSeats: ["A1"],
  ...overrides,
});

const screen = (overrides = {}) => ({
  _id: JAGADAMBA_SCREEN_1,
  theatre: JAGADAMBA_ID,
  name: "JAGADAMBA",
  screenNumber: 1,
  capacity: 1016,
  isActive: true,
  ...overrides,
});

const createShowFindQuery = (shows) => {
  const query = {
    populate: jest.fn(() => query),
    then: (resolve) => resolve(shows),
  };
  return query;
};

const makeModels = ({ shows, screensById = {}, modifiedCount = 1 }) => ({
  Show: {
    find: jest.fn(() => createShowFindQuery(shows)),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount }),
  },
  Screen: {
    findById: jest.fn((screenId) => Promise.resolve(screensById[screenId] || null)),
  },
});

describe("backfillMultiplexShowScreens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("normalizes exact scheduler and AM/PM time formats deterministically", () => {
    expect(normalizeShowTime("10:30")).toBe("10:30");
    expect(normalizeShowTime("02:30 PM")).toBe("14:30");
    expect(normalizeShowTime("6:30 pm")).toBe("18:30");
    expect(normalizeShowTime("21:30")).toBe("21:30");
    expect(normalizeShowTime("around 10:30")).toBeNull();
  });

  test("extracts Mongoose ObjectId-like values without recursive _id unwrapping", () => {
    const objectIdLike = {
      toHexString: () => JAGADAMBA_ID,
    };
    objectIdLike._id = objectIdLike;

    expect(getDocumentId(objectIdLike)).toBe(JAGADAMBA_ID);
  });

  test("unassigned Jagadamba Show at 10:30 maps to configured Screen 1", async () => {
    const { Show, Screen } = makeModels({
      shows: [show()],
      screensById: {
        [JAGADAMBA_SCREEN_1]: screen(),
      },
    });

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: false,
      logger,
    });

    expect(Screen.findById).toHaveBeenCalledWith(JAGADAMBA_SCREEN_1);
    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Mapped Screen: JAGADAMBA / Screen 1");
    expect(logger.log).toHaveBeenCalledWith("Action: WOULD UPDATE");
    expect(summary.updated).toBe(1);
  });

  test("unassigned Jagadamba Show at 14:30 maps to configured Screen 2", async () => {
    const { Show, Screen } = makeModels({
      shows: [show({ time: "02:30 PM", name: "Afternoon Show" })],
      screensById: {
        [JAGADAMBA_SCREEN_2]: screen({
          _id: JAGADAMBA_SCREEN_2,
          name: "SARADA 4K",
          screenNumber: 2,
          capacity: 386,
        }),
      },
    });

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: false,
      logger,
    });

    expect(Screen.findById).toHaveBeenCalledWith(JAGADAMBA_SCREEN_2);
    expect(summary.updated).toBe(1);
  });

  test("unassigned INOX Show at 18:30 maps to configured Screen 3", async () => {
    const inoxShow = show({
      theatre: { _id: INOX_ID, name: "INOX: Varun Beach, Beach Road" },
      time: "18:30",
      name: "First Show",
    });
    const { Show, Screen } = makeModels({
      shows: [inoxShow],
      screensById: {
        [INOX_SCREEN_3]: screen({
          _id: INOX_SCREEN_3,
          theatre: INOX_ID,
          name: "Screen 3",
          screenNumber: 3,
          capacity: 210,
        }),
      },
    });

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: false,
      logger,
    });

    expect(Screen.findById).toHaveBeenCalledWith(INOX_SCREEN_3);
    expect(summary.updated).toBe(1);
  });

  test("already assigned Show is unchanged", async () => {
    const { Show, Screen } = makeModels({
      shows: [show({ screen: { _id: JAGADAMBA_SCREEN_1, name: "JAGADAMBA" } })],
    });

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: true,
      logger,
    });

    expect(Screen.findById).not.toHaveBeenCalled();
    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(summary.alreadyAssigned).toBe(1);
  });

  test("Theatre not in config is unchanged", async () => {
    const { Show, Screen } = makeModels({
      shows: [show({ theatre: { _id: SINGLE_SCREEN_THEATRE_ID, name: "Sangam Theatre" } })],
    });

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: true,
      logger,
    });

    expect(Screen.findById).not.toHaveBeenCalled();
    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(summary.theatreNotConfigured).toBe(1);
  });

  test("No slot mapping is skipped", async () => {
    const { Show, Screen } = makeModels({
      shows: [show({ time: "21:30" })],
    });

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: true,
      logger,
    });

    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Action: SKIPPED - NO SLOT ASSIGNMENT");
    expect(summary.noSlotAssignment).toBe(1);
  });

  test("Configured Screen missing is skipped", async () => {
    const { Show } = makeModels({
      shows: [show()],
      screensById: {},
    });
    const Screen = { findById: jest.fn().mockResolvedValue(null) };

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: true,
      logger,
    });

    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Action: SKIPPED - INVALID SCREEN");
    expect(summary.invalidScreen).toBe(1);
  });

  test("Configured Screen belonging to another Theatre is skipped", async () => {
    const { Show, Screen } = makeModels({
      shows: [show()],
      screensById: {
        [JAGADAMBA_SCREEN_1]: screen({ theatre: "different-theatre" }),
      },
    });

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: true,
      logger,
    });

    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Action: SKIPPED - CROSS THEATRE SCREEN");
    expect(summary.crossTheatreScreen).toBe(1);
  });

  test("Configured inactive Screen is skipped", async () => {
    const { Show, Screen } = makeModels({
      shows: [show()],
      screensById: {
        [JAGADAMBA_SCREEN_1]: screen({ isActive: false }),
      },
    });

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: true,
      logger,
    });

    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Action: SKIPPED - INACTIVE SCREEN");
    expect(summary.inactiveScreen).toBe(1);
  });

  test("Unsupported time format is skipped", async () => {
    const { Show, Screen } = makeModels({
      shows: [show({ time: "morning" })],
    });

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: true,
      logger,
    });

    expect(Screen.findById).not.toHaveBeenCalled();
    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Action: SKIPPED - UNSUPPORTED TIME FORMAT");
    expect(summary.unsupportedTime).toBe(1);
  });

  test("--apply updates only screen with unassigned guard and keeps unrelated fields untouched", async () => {
    const legacyShow = show();
    const { Show, Screen } = makeModels({
      shows: [legacyShow],
      screensById: {
        [JAGADAMBA_SCREEN_1]: screen(),
      },
      modifiedCount: 1,
    });

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: true,
      logger,
    });

    expect(Show.updateOne).toHaveBeenCalledWith(
      {
        _id: "show-1",
        $or: [
          { screen: { $exists: false } },
          { screen: null },
        ],
      },
      { $set: { screen: JAGADAMBA_SCREEN_1 } },
      { timestamps: false }
    );
    const updatePayload = Show.updateOne.mock.calls[0][1];
    expect(updatePayload).not.toHaveProperty("theatre");
    expect(updatePayload).not.toHaveProperty("movie");
    expect(updatePayload).not.toHaveProperty("ticketPrice");
    expect(updatePayload).not.toHaveProperty("totalSeats");
    expect(updatePayload).not.toHaveProperty("bookedSeats");
    expect(summary.updated).toBe(1);
  });

  test("dry-run performs no DB write", async () => {
    const { Show, Screen } = makeModels({
      shows: [show()],
      screensById: {
        [JAGADAMBA_SCREEN_1]: screen(),
      },
    });

    await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: false,
      logger,
    });

    expect(Show.updateOne).not.toHaveBeenCalled();
  });

  test("rerun after apply is idempotent when guarded update matches no document", async () => {
    const { Show, Screen } = makeModels({
      shows: [show()],
      screensById: {
        [JAGADAMBA_SCREEN_1]: screen(),
      },
      modifiedCount: 0,
    });

    const summary = await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: true,
      logger,
    });

    expect(summary.updated).toBe(0);
    expect(summary.alreadyAssigned).toBe(1);
  });

  test("existing ticketPrice, totalSeats, and bookedSeats remain unchanged by update payload", async () => {
    const { Show, Screen } = makeModels({
      shows: [show({ ticketPrice: 250, totalSeats: 386, bookedSeats: ["A1", "A2"] })],
      screensById: {
        [JAGADAMBA_SCREEN_1]: screen(),
      },
      modifiedCount: 1,
    });

    await runMultiplexShowScreenBackfill({
      Show,
      Screen,
      screenAssignments,
      applyChanges: true,
      logger,
    });

    expect(Show.updateOne.mock.calls[0][1]).toEqual({ $set: { screen: JAGADAMBA_SCREEN_1 } });
  });
});
