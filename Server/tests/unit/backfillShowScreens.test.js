const { runShowScreenBackfill } = require("../../scripts/backfillShowScreens");

const THEATRE_ID = "theatre-1";
const OTHER_THEATRE_ID = "theatre-2";
const SCREEN_ID = "screen-1";

const logger = {
  log: jest.fn(),
  error: jest.fn(),
};

const show = (overrides = {}) => ({
  _id: "show-1",
  name: "Morning Show",
  theatre: {
    _id: THEATRE_ID,
    name: "Sangam Theatre 4K Dolby Atmos: Vizag",
  },
  movie: "movie-1",
  date: "2026-09-03",
  time: "10:00",
  ticketPrice: 200,
  totalSeats: 650,
  bookedSeats: ["A1"],
  ...overrides,
});

const activeScreen = (overrides = {}) => ({
  _id: SCREEN_ID,
  theatre: THEATRE_ID,
  name: "Screen 1",
  screenNumber: 1,
  capacity: 650,
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

const createScreenFindQuery = (screens) => ({
  sort: jest.fn().mockResolvedValue(screens),
});

describe("backfillShowScreens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("legacy Show with exactly one active Screen is proposed in dry-run without writes", async () => {
    const Show = {
      find: jest.fn(() => createShowFindQuery([show()])),
      updateOne: jest.fn(),
    };
    const Screen = {
      find: jest.fn(() => createScreenFindQuery([activeScreen()])),
    };

    const summary = await runShowScreenBackfill({ Show, Screen, applyChanges: false, logger });

    expect(Screen.find).toHaveBeenCalledWith({ theatre: THEATRE_ID, isActive: true });
    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Show: Morning Show");
    expect(logger.log).toHaveBeenCalledWith("Theatre: Sangam Theatre 4K Dolby Atmos: Vizag");
    expect(logger.log).toHaveBeenCalledWith("Current Screen: Legacy / Unassigned");
    expect(logger.log).toHaveBeenCalledWith("Active Screens Found: 1");
    expect(logger.log).toHaveBeenCalledWith("Target Screen: Screen 1");
    expect(logger.log).toHaveBeenCalledWith("Action: WOULD UPDATE");
    expect(summary).toMatchObject({
      showsScanned: 1,
      updated: 1,
      noScreenSkipped: 0,
      ambiguousSkipped: 0,
    });
  });

  test("--apply assigns exactly one active Screen and does not touch unrelated Show fields", async () => {
    const legacyShow = show();
    const Show = {
      find: jest.fn(() => createShowFindQuery([legacyShow])),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const Screen = {
      find: jest.fn(() => createScreenFindQuery([activeScreen()])),
    };

    const summary = await runShowScreenBackfill({ Show, Screen, applyChanges: true, logger });

    expect(Show.updateOne).toHaveBeenCalledWith(
      {
        _id: "show-1",
        $or: [
          { screen: { $exists: false } },
          { screen: null },
        ],
      },
      { $set: { screen: SCREEN_ID } }
    );
    expect(Show.updateOne.mock.calls[0][1]).not.toHaveProperty("movie");
    expect(Show.updateOne.mock.calls[0][1]).not.toHaveProperty("theatre");
    expect(Show.updateOne.mock.calls[0][1]).not.toHaveProperty("bookedSeats");
    expect(summary.updated).toBe(1);
  });

  test("already assigned Show is unchanged and reported", async () => {
    const Show = {
      find: jest.fn(() => createShowFindQuery([show({ screen: { _id: SCREEN_ID, name: "Screen 1" } })])),
      updateOne: jest.fn(),
    };
    const Screen = {
      find: jest.fn(),
    };

    const summary = await runShowScreenBackfill({ Show, Screen, applyChanges: true, logger });

    expect(Screen.find).not.toHaveBeenCalled();
    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Action: SKIPPED - ALREADY ASSIGNED");
    expect(summary.alreadyAssigned).toBe(1);
  });

  test("zero active Screens are skipped", async () => {
    const Show = {
      find: jest.fn(() => createShowFindQuery([show()])),
      updateOne: jest.fn(),
    };
    const Screen = {
      find: jest.fn(() => createScreenFindQuery([])),
    };

    const summary = await runShowScreenBackfill({ Show, Screen, applyChanges: true, logger });

    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Action: SKIPPED - NO SCREEN");
    expect(summary.noScreenSkipped).toBe(1);
  });

  test("multiple active Screens are ambiguous and skipped", async () => {
    const Show = {
      find: jest.fn(() => createShowFindQuery([show({ name: "Evening Show" })])),
      updateOne: jest.fn(),
    };
    const Screen = {
      find: jest.fn(() => createScreenFindQuery([
        activeScreen(),
        activeScreen({ _id: "screen-2", name: "Screen 2", screenNumber: 2 }),
      ])),
    };

    const summary = await runShowScreenBackfill({ Show, Screen, applyChanges: true, logger });

    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Active Screens Found: 2");
    expect(logger.log).toHaveBeenCalledWith("Action: SKIPPED - AMBIGUOUS");
    expect(summary.ambiguousSkipped).toBe(1);
  });

  test("inactive Screens are not selected", async () => {
    const Show = {
      find: jest.fn(() => createShowFindQuery([show()])),
      updateOne: jest.fn(),
    };
    const Screen = {
      find: jest.fn(() => createScreenFindQuery([])),
    };

    await runShowScreenBackfill({ Show, Screen, applyChanges: true, logger });

    expect(Screen.find).toHaveBeenCalledWith({ theatre: THEATRE_ID, isActive: true });
    expect(Show.updateOne).not.toHaveBeenCalled();
  });

  test("Screen theatre mismatch is reported and skipped", async () => {
    const Show = {
      find: jest.fn(() => createShowFindQuery([show()])),
      updateOne: jest.fn(),
    };
    const Screen = {
      find: jest.fn(() => createScreenFindQuery([activeScreen({ theatre: OTHER_THEATRE_ID })])),
    };

    const summary = await runShowScreenBackfill({ Show, Screen, applyChanges: true, logger });

    expect(Show.updateOne).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("Action: SKIPPED - SCREEN THEATRE MISMATCH");
    expect(summary.errors).toBe(1);
  });

  test("repeated --apply is idempotent when update guard matches no document", async () => {
    const Show = {
      find: jest.fn(() => createShowFindQuery([show()])),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    };
    const Screen = {
      find: jest.fn(() => createScreenFindQuery([activeScreen()])),
    };

    const summary = await runShowScreenBackfill({ Show, Screen, applyChanges: true, logger });

    expect(Show.updateOne).toHaveBeenCalled();
    expect(summary.updated).toBe(0);
    expect(summary.alreadyAssigned).toBe(1);
  });
});
