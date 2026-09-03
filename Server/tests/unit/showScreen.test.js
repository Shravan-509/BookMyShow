const mongoose = require("mongoose");
const AppError = require("../../utils/AppError");
const { createMockResponse } = require("../helpers/mockExpress");

const THEATRE_ID = new mongoose.Types.ObjectId().toString();
const SCREEN_ID = new mongoose.Types.ObjectId().toString();
const MOVIE_ID = new mongoose.Types.ObjectId().toString();
const PARTNER_ID = new mongoose.Types.ObjectId().toString();

const showPayload = {
  name: "Evening Show",
  date: "2026-09-03",
  time: "18:00",
  movie: MOVIE_ID,
  ticketPrice: 200,
  totalSeats: 650,
  theatre: THEATRE_ID,
};

const selectQuery = (value) => ({
  select: jest.fn().mockResolvedValue(value),
});

const populateQuery = (value) => ({
  populate: jest.fn().mockReturnThis(),
  then: (resolve) => resolve(value),
});

const loadController = ({ screenError = null } = {}) => {
  jest.resetModules();

  function Show(payload) {
    Show.lastPayload = payload;
    this.save = jest.fn().mockResolvedValue({ _id: "show-1", ...payload });
  }
  Show.findById = jest.fn();
  Show.findByIdAndUpdate = jest.fn();
  Show.findByIdAndDelete = jest.fn();
  Show.find = jest.fn();

  const Theatre = {
    findById: jest.fn(() => selectQuery({ _id: THEATRE_ID, owner: PARTNER_ID })),
  };

  const screenService = {
    ensureActiveScreenForTheatre: jest.fn(() => {
      if (screenError) {
        throw screenError;
      }
      return Promise.resolve({ _id: SCREEN_ID, theatre: THEATRE_ID, capacity: 250, isActive: true });
    }),
  };

  jest.doMock("../../models/showSchema", () => Show);
  jest.doMock("../../models/theatreSchema", () => Theatre);
  jest.doMock("../../services/screenService", () => screenService);

  return {
    Show,
    Theatre,
    screenService,
    controller: require("../../controllers/ShowController"),
  };
};

const request = (body) => ({
  body,
  user: { role: "admin" },
  userId: PARTNER_ID,
});

describe("Show screen association", () => {
  test("legacy Show creation without Screen remains valid", async () => {
    const { controller, Show, screenService } = loadController();
    const res = createMockResponse();

    await controller.addShow(request(showPayload), res, jest.fn());

    expect(screenService.ensureActiveScreenForTheatre).not.toHaveBeenCalled();
    expect(Show.lastPayload).toEqual(showPayload);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("Show creation accepts valid Screen", async () => {
    const { controller, Show, screenService } = loadController();
    const res = createMockResponse();

    await controller.addShow(request({ ...showPayload, screen: SCREEN_ID, totalSeats: 999 }), res, jest.fn());

    expect(screenService.ensureActiveScreenForTheatre).toHaveBeenCalledWith(expect.any(Object), {
      screenId: SCREEN_ID,
      theatreId: THEATRE_ID,
    });
    expect(Show.lastPayload.screen).toBe(SCREEN_ID);
    expect(Show.lastPayload.totalSeats).toBe(250);
  });

  test("invalid or cross-Theatre Screen rejects Show creation", async () => {
    const screenError = new AppError("Screen must belong to the selected theatre", 400, "SCREEN_THEATRE_MISMATCH");
    const { controller, Show } = loadController({ screenError });
    const res = createMockResponse();
    const next = jest.fn();

    await controller.addShow(request({ ...showPayload, screen: SCREEN_ID }), res, next);

    expect(Show.lastPayload).toBeUndefined();
    expect(next).toHaveBeenCalledWith(screenError);
  });

  test("Show update validates supplied Screen", async () => {
    const { controller, Show, screenService } = loadController();
    const res = createMockResponse();
    Show.findById.mockReturnValue(selectQuery({ _id: "show-1", theatre: THEATRE_ID }));
    Show.findByIdAndUpdate.mockReturnValue(populateQuery({ _id: "show-1", ...showPayload, screen: SCREEN_ID }));

    await controller.updateShow(
      { ...request({ ...showPayload, screen: SCREEN_ID }), params: { id: "show-1" } },
      res,
      jest.fn()
    );

    expect(screenService.ensureActiveScreenForTheatre).toHaveBeenCalledWith(expect.any(Object), {
      screenId: SCREEN_ID,
      theatreId: THEATRE_ID,
    });
    expect(Show.findByIdAndUpdate).toHaveBeenCalledWith(
      "show-1",
      expect.objectContaining({ screen: SCREEN_ID, totalSeats: 250 }),
      expect.any(Object)
    );
  });

  test("legacy Show creation without Screen keeps submitted totalSeats", async () => {
    const { controller, Show } = loadController();
    const res = createMockResponse();

    await controller.addShow(request({ ...showPayload, totalSeats: 300 }), res, jest.fn());

    expect(Show.lastPayload.totalSeats).toBe(300);
    expect(Show.lastPayload.screen).toBeUndefined();
  });
});
