const mongoose = require("mongoose");

const SCREEN_ID = new mongoose.Types.ObjectId().toString();
const SEAT_ID = new mongoose.Types.ObjectId().toString();
const THEATRE_ID = new mongoose.Types.ObjectId().toString();
const PARTNER_ID = new mongoose.Types.ObjectId().toString();
const OTHER_PARTNER_ID = new mongoose.Types.ObjectId().toString();

const req = (role = "admin", userId = PARTNER_ID) => ({
  user: { role },
  userId,
});

const selectQuery = (value) => ({
  select: jest.fn().mockResolvedValue(value),
});

const populatedSeat = (overrides = {}) => ({
  _id: SEAT_ID,
  screen: {
    _id: SCREEN_ID,
    theatre: THEATRE_ID,
    capacity: 2,
    isActive: true,
  },
  seatNumber: "A1",
  row: "A",
  column: 1,
  seatType: "STANDARD",
  isActive: true,
  toObject() {
    return {
      _id: this._id,
      screen: this.screen,
      seatNumber: this.seatNumber,
      row: this.row,
      column: this.column,
      seatType: this.seatType,
      isActive: this.isActive,
    };
  },
  ...overrides,
});

const loadService = ({
  screen = { _id: SCREEN_ID, theatre: THEATRE_ID, capacity: 2, isActive: true },
  theatre = { _id: THEATRE_ID, owner: PARTNER_ID, isActive: true },
} = {}) => {
  jest.resetModules();

  const repository = {
    createSeat: jest.fn(),
    insertSeats: jest.fn(),
    findById: jest.fn(),
    findByScreen: jest.fn(),
    countActiveByScreen: jest.fn(),
    findDuplicateSeatNumber: jest.fn(),
    findDuplicatePosition: jest.fn(),
    updateSeat: jest.fn(),
  };
  const Screen = {
    findById: jest.fn(() => selectQuery(screen)),
  };
  const Theatre = {
    findById: jest.fn(() => selectQuery(theatre)),
  };

  jest.doMock("../../repositories/seatRepository", () => repository);
  jest.doMock("../../models/screenSchema", () => Screen);
  jest.doMock("../../models/theatreSchema", () => Theatre);

  return {
    repository,
    Screen,
    Theatre,
    service: require("../../services/seatService"),
  };
};

describe("seatService", () => {
  test("creates a valid Seat with normalization for admin", async () => {
    const { service, repository } = loadService();
    repository.findDuplicateSeatNumber.mockResolvedValue(null);
    repository.findDuplicatePosition.mockResolvedValue(null);
    repository.countActiveByScreen.mockResolvedValue(0);
    repository.createSeat.mockResolvedValue({ _id: SEAT_ID, seatNumber: "A1" });

    const seat = await service.createSeat(req("admin"), {
      screen: SCREEN_ID,
      seatNumber: " a1 ",
      row: " a ",
      column: 1,
      seatType: "standard",
    });

    expect(repository.createSeat).toHaveBeenCalledWith({
      screen: SCREEN_ID,
      seatNumber: "A1",
      row: "A",
      column: 1,
      seatType: "STANDARD",
      isActive: true,
    });
    expect(seat._id).toBe(SEAT_ID);
  });

  test("allows owner partner and denies non-owner partner", async () => {
    const { service, repository } = loadService();
    repository.findDuplicateSeatNumber.mockResolvedValue(null);
    repository.findDuplicatePosition.mockResolvedValue(null);
    repository.countActiveByScreen.mockResolvedValue(0);
    repository.createSeat.mockResolvedValue({ _id: SEAT_ID });

    await expect(service.createSeat(req("partner", PARTNER_ID), {
      screen: SCREEN_ID,
      seatNumber: "A1",
      row: "A",
      column: 1,
      seatType: "STANDARD",
    })).resolves.toMatchObject({ _id: SEAT_ID });

    const { service: deniedService } = loadService({
      theatre: { _id: THEATRE_ID, owner: OTHER_PARTNER_ID, isActive: true },
    });

    await expect(deniedService.createSeat(req("partner", PARTNER_ID), {
      screen: SCREEN_ID,
      seatNumber: "A1",
      row: "A",
      column: 1,
      seatType: "STANDARD",
    })).rejects.toMatchObject({ statusCode: 403, code: "SEAT_ACCESS_DENIED" });
  });

  test("rejects normal user and missing Screen", async () => {
    const { service } = loadService();

    await expect(service.createSeat(req("user"), {
      screen: SCREEN_ID,
      seatNumber: "A1",
      row: "A",
      column: 1,
      seatType: "STANDARD",
    })).rejects.toMatchObject({ statusCode: 403, code: "SEAT_ACCESS_DENIED" });

    const { service: missingService } = loadService({ screen: null });
    await expect(missingService.createSeat(req("admin"), {
      screen: SCREEN_ID,
      seatNumber: "A1",
      row: "A",
      column: 1,
      seatType: "STANDARD",
    })).rejects.toMatchObject({ statusCode: 404, code: "SCREEN_NOT_FOUND" });
  });

  test("rejects duplicate Seat number and duplicate physical position", async () => {
    const { service, repository } = loadService();
    repository.findDuplicateSeatNumber.mockResolvedValueOnce({ _id: "existing" });

    await expect(service.createSeat(req("admin"), {
      screen: SCREEN_ID,
      seatNumber: "A1",
      row: "A",
      column: 1,
      seatType: "STANDARD",
    })).rejects.toMatchObject({ statusCode: 409, code: "DUPLICATE_SEAT_NUMBER" });

    repository.findDuplicateSeatNumber.mockResolvedValueOnce(null);
    repository.findDuplicatePosition.mockResolvedValueOnce({ _id: "existing" });

    await expect(service.createSeat(req("admin"), {
      screen: SCREEN_ID,
      seatNumber: "A1",
      row: "A",
      column: 1,
      seatType: "STANDARD",
    })).rejects.toMatchObject({ statusCode: 409, code: "DUPLICATE_SEAT_POSITION" });
  });

  test("rejects inconsistent seatNumber and capacity overflow", async () => {
    const { service, repository } = loadService();

    await expect(service.createSeat(req("admin"), {
      screen: SCREEN_ID,
      seatNumber: "B7",
      row: "A",
      column: 1,
      seatType: "STANDARD",
    })).rejects.toMatchObject({ statusCode: 400, code: "SEAT_POSITION_MISMATCH" });

    repository.findDuplicateSeatNumber.mockResolvedValue(null);
    repository.findDuplicatePosition.mockResolvedValue(null);
    repository.countActiveByScreen.mockResolvedValue(2);

    await expect(service.createSeat(req("admin"), {
      screen: SCREEN_ID,
      seatNumber: "A1",
      row: "A",
      column: 1,
      seatType: "STANDARD",
    })).rejects.toMatchObject({ statusCode: 400, code: "SCREEN_CAPACITY_EXCEEDED" });
  });

  test("lists Seats with capacity summary and layout status", async () => {
    const { service, repository } = loadService({ screen: { _id: SCREEN_ID, theatre: THEATRE_ID, capacity: 2, isActive: true } });
    repository.findByScreen.mockResolvedValue([
      { _id: "seat-1", isActive: true },
      { _id: "seat-2", isActive: false },
    ]);

    const result = await service.getSeatsByScreen(req("admin"), SCREEN_ID);

    expect(result.summary).toEqual({
      capacity: 2,
      activeSeatCount: 1,
      remainingCapacity: 1,
      layoutStatus: "INCOMPLETE",
    });
  });

  test("updates, disables, and re-enables Seat with capacity validation", async () => {
    const { service, repository } = loadService();
    repository.findById.mockResolvedValue(populatedSeat({ isActive: false }));
    repository.findDuplicateSeatNumber.mockResolvedValue(null);
    repository.findDuplicatePosition.mockResolvedValue(null);
    repository.countActiveByScreen.mockResolvedValue(1);
    repository.updateSeat.mockResolvedValue({ _id: SEAT_ID, isActive: true });

    await service.updateSeat(req("admin"), SEAT_ID, {
      seatNumber: "A1",
      row: "A",
      column: 1,
      seatType: "PREMIUM",
      isActive: true,
    });

    expect(repository.updateSeat).toHaveBeenCalledWith(SEAT_ID, expect.objectContaining({
      seatType: "PREMIUM",
      isActive: true,
    }));

    repository.findById.mockResolvedValue(populatedSeat());
    await service.disableSeat(req("admin"), SEAT_ID);
    expect(repository.updateSeat).toHaveBeenCalledWith(SEAT_ID, { isActive: false });

    repository.findById.mockResolvedValue(populatedSeat({ isActive: false }));
    repository.countActiveByScreen.mockResolvedValue(2);
    await expect(service.updateSeat(req("admin"), SEAT_ID, { isActive: true })).rejects.toMatchObject({
      statusCode: 400,
      code: "SCREEN_CAPACITY_EXCEEDED",
    });
  });

  test("bulk creates valid rows with excluded columns only after full validation", async () => {
    const { service, repository } = loadService({ screen: { _id: SCREEN_ID, theatre: THEATRE_ID, capacity: 10, isActive: true } });
    repository.findByScreen.mockResolvedValue([]);
    repository.countActiveByScreen.mockResolvedValue(0);
    repository.insertSeats.mockImplementation((payloads) => Promise.resolve(payloads));

    const seats = await service.bulkCreateSeats(req("admin"), SCREEN_ID, [
      { row: "a", startColumn: 1, endColumn: 4, excludedColumns: [2], seatType: "standard" },
      { row: "b", startColumn: 1, endColumn: 2, seatType: "premium" },
    ]);

    expect(seats.map((seat) => seat.seatNumber)).toEqual(["A1", "A3", "A4", "B1", "B2"]);
    expect(repository.insertSeats).toHaveBeenCalledTimes(1);
  });

  test("bulk validation rejects invalid ranges, duplicate request seats, existing duplicates, and overflow without insert", async () => {
    const { service, repository } = loadService({ screen: { _id: SCREEN_ID, theatre: THEATRE_ID, capacity: 2, isActive: true } });

    await expect(service.bulkCreateSeats(req("admin"), SCREEN_ID, [
      { row: "A", startColumn: 5, endColumn: 1, seatType: "STANDARD" },
    ])).rejects.toMatchObject({ statusCode: 400, code: "INVALID_SEAT_RANGE" });

    await expect(service.bulkCreateSeats(req("admin"), SCREEN_ID, [
      { row: "A", startColumn: 1, endColumn: 2, excludedColumns: [3], seatType: "STANDARD" },
    ])).rejects.toMatchObject({ statusCode: 400, code: "INVALID_EXCLUDED_COLUMNS" });

    await expect(service.bulkCreateSeats(req("admin"), SCREEN_ID, [
      { row: "A", startColumn: 1, endColumn: 1, seatType: "STANDARD" },
      { row: "A", startColumn: 1, endColumn: 1, seatType: "PREMIUM" },
    ])).rejects.toMatchObject({ statusCode: 400, code: "DUPLICATE_SEAT_IN_REQUEST" });

    repository.findByScreen.mockResolvedValue([{ seatNumber: "A1", row: "A", column: 1 }]);
    await expect(service.bulkCreateSeats(req("admin"), SCREEN_ID, [
      { row: "A", startColumn: 1, endColumn: 1, seatType: "STANDARD" },
    ])).rejects.toMatchObject({ statusCode: 409, code: "DUPLICATE_SEAT_NUMBER" });

    repository.findByScreen.mockResolvedValue([]);
    repository.countActiveByScreen.mockResolvedValue(1);
    await expect(service.bulkCreateSeats(req("admin"), SCREEN_ID, [
      { row: "A", startColumn: 1, endColumn: 2, seatType: "STANDARD" },
    ])).rejects.toMatchObject({ statusCode: 400, code: "SCREEN_CAPACITY_EXCEEDED" });

    expect(repository.insertSeats).not.toHaveBeenCalled();
  });
});
