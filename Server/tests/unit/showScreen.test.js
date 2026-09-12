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

const loadController = ({
  screenError = null,
  auditClassification = "READY",
  initializeResult = null,
  transactionError = null,
  existingShowSeatCount = 0,
} = {}) => {
  jest.resetModules();

  const actualMongoose = jest.requireActual("mongoose");
  const session = {
    withTransaction: jest.fn(async (callback) => {
      if (transactionError) {
        throw transactionError;
      }
      return callback();
    }),
    endSession: jest.fn(),
  };
  const mongooseMock = {
    ...actualMongoose,
    startSession: jest.fn().mockResolvedValue(session),
  };

  function Show(payload) {
    Show.lastPayload = payload;
    Object.assign(this, { _id: "show-1", ...payload });
    this.save = jest.fn().mockResolvedValue(this);
    Show.lastInstance = this;
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

  const showSeatService = {
    SHOW_SEAT_AUDIT_CLASSIFICATION: {
      READY: "READY",
      ALREADY_INITIALIZED: "ALREADY_INITIALIZED",
      INCOMPLETE_SCREEN_LAYOUT: "INCOMPLETE_SCREEN_LAYOUT",
      NO_ACTIVE_SEATS: "NO_ACTIVE_SEATS",
      OTHER_ERROR: "OTHER_ERROR",
    },
    auditShowSeatInitialization: jest.fn().mockResolvedValue({
      classification: auditClassification,
      screenCapacity: 250,
      activeSeatCount: 250,
      expectedShowSeatCount: 250,
    }),
    initializeShowSeats: jest.fn().mockResolvedValue(initializeResult || {
      initialized: true,
      insertedCount: 250,
      persistedCount: 250,
    }),
  };

  const showSeatRepository = {
    countByShow: jest.fn().mockResolvedValue(existingShowSeatCount),
    deleteByShow: jest.fn().mockResolvedValue({ deletedCount: existingShowSeatCount }),
  };

  jest.doMock("mongoose", () => mongooseMock);
  jest.doMock("../../models/showSchema", () => Show);
  jest.doMock("../../models/theatreSchema", () => Theatre);
  jest.doMock("../../services/screenService", () => screenService);
  jest.doMock("../../services/showSeatService", () => showSeatService);
  jest.doMock("../../repositories/showSeatRepository", () => showSeatRepository);

  return {
    Show,
    Theatre,
    screenService,
    showSeatService,
    showSeatRepository,
    mongooseMock,
    session,
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
    const { controller, Show, screenService, showSeatService, mongooseMock } = loadController();
    const res = createMockResponse();

    await controller.addShow(request(showPayload), res, jest.fn());

    expect(screenService.ensureActiveScreenForTheatre).not.toHaveBeenCalled();
    expect(showSeatService.initializeShowSeats).not.toHaveBeenCalled();
    expect(mongooseMock.startSession).not.toHaveBeenCalled();
    expect(Show.lastPayload).toEqual(showPayload);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("Show creation persists valid ticketPricing without changing legacy payload compatibility", async () => {
    const { controller, Show } = loadController();
    const res = createMockResponse();

    await controller.addShow(request({
      ...showPayload,
      ticketPricing: {
        STANDARD: 150,
        PREMIUM: 220,
        RECLINER: 320,
      },
    }), res, jest.fn());

    expect(Show.lastPayload).toEqual(expect.objectContaining({
      ticketPrice: 200,
      ticketPricing: {
        STANDARD: 150,
        PREMIUM: 220,
        RECLINER: 320,
      },
    }));
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("invalid ticketPricing rejects Show creation", async () => {
    const { controller, Show } = loadController();
    const res = createMockResponse();
    const next = jest.fn();

    await controller.addShow(request({
      ...showPayload,
      ticketPricing: {
        STANDARD: 0,
      },
    }), res, next);

    expect(Show.lastPayload).toBeUndefined();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      code: "INVALID_TICKET_PRICING",
    }));
  });

  test("Show creation accepts valid Screen and initializes ShowSeat inventory transactionally", async () => {
    const { controller, Show, screenService, showSeatService, mongooseMock, session } = loadController();
    const res = createMockResponse();

    await controller.addShow(request({ ...showPayload, screen: SCREEN_ID, totalSeats: 999 }), res, jest.fn());

    expect(mongooseMock.startSession).toHaveBeenCalledTimes(1);
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(screenService.ensureActiveScreenForTheatre).toHaveBeenCalledWith(expect.any(Object), {
      screenId: SCREEN_ID,
      theatreId: THEATRE_ID,
    }, { session });
    expect(Show.lastPayload.screen).toBe(SCREEN_ID);
    expect(Show.lastPayload.totalSeats).toBe(250);
    expect(showSeatService.auditShowSeatInitialization).toHaveBeenCalledWith(expect.objectContaining({
      _id: "show-1",
      screen: SCREEN_ID,
      totalSeats: 250,
      bookedSeats: [],
    }), { session });
    expect(showSeatService.initializeShowSeats).toHaveBeenCalledWith(expect.objectContaining({
      _id: "show-1",
      screen: SCREEN_ID,
    }), { session });
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("scheduler-style screen payload without totalSeats derives capacity and initializes inventory", async () => {
    const { controller, Show, showSeatService } = loadController();
    const res = createMockResponse();

    await controller.addShow(
      request({
        name: showPayload.name,
        date: showPayload.date,
        time: showPayload.time,
        movie: showPayload.movie,
        ticketPrice: showPayload.ticketPrice,
        theatre: showPayload.theatre,
        screen: SCREEN_ID,
      }),
      res,
      jest.fn()
    );

    expect(Show.lastPayload.totalSeats).toBe(250);
    expect(showSeatService.initializeShowSeats).toHaveBeenCalled();
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

  test("zero active Seats reject screen-aware Show creation before save", async () => {
    const { controller, Show } = loadController({ auditClassification: "NO_ACTIVE_SEATS" });
    const res = createMockResponse();
    const next = jest.fn();

    await controller.addShow(request({ ...showPayload, screen: SCREEN_ID }), res, next);

    expect(Show.lastPayload).toEqual(expect.objectContaining({ screen: SCREEN_ID }));
    expect(Show.lastInstance.save).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 409,
      code: "SCREEN_HAS_NO_ACTIVE_SEATS",
    }));
  });

  test("incomplete Screen layout rejects screen-aware Show creation before save", async () => {
    const { controller, showSeatService } = loadController({ auditClassification: "INCOMPLETE_SCREEN_LAYOUT" });
    const res = createMockResponse();
    const next = jest.fn();

    await controller.addShow(request({ ...showPayload, screen: SCREEN_ID }), res, next);

    expect(showSeatService.initializeShowSeats).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 409,
      code: "SCREEN_LAYOUT_INCOMPLETE",
    }));
  });

  test("ShowSeat initialization failure aborts the create transaction", async () => {
    const { controller, showSeatService, session } = loadController({
      initializeResult: {
        initialized: false,
        persistedCount: 0,
        classification: "OTHER_ERROR",
      },
    });
    const res = createMockResponse();
    const next = jest.fn();

    await controller.addShow(request({ ...showPayload, screen: SCREEN_ID }), res, next);

    expect(showSeatService.initializeShowSeats).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 500,
      code: "SHOWSEAT_INITIALIZATION_FAILED",
    }));
  });

  test("transaction support failure returns a clear operational error", async () => {
    const { controller } = loadController({
      transactionError: new Error("Transaction numbers are only allowed on a replica set member or mongos"),
    });
    const res = createMockResponse();
    const next = jest.fn();

    await controller.addShow(request({ ...showPayload, screen: SCREEN_ID }), res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 500,
      code: "SHOW_TRANSACTION_REQUIRED",
    }));
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
    }, {});
    expect(Show.findByIdAndUpdate).toHaveBeenCalledWith(
      "show-1",
      expect.objectContaining({ screen: SCREEN_ID, totalSeats: 250 }),
      expect.any(Object)
    );
  });

  test("changing Screen on an initialized Show is rejected", async () => {
    const otherScreenId = new mongoose.Types.ObjectId().toString();
    const { controller, Show, showSeatRepository } = loadController({ existingShowSeatCount: 250 });
    const res = createMockResponse();
    const next = jest.fn();
    Show.findById.mockReturnValue(selectQuery({ _id: "show-1", theatre: THEATRE_ID, screen: SCREEN_ID }));

    await controller.updateShow(
      { ...request({ ...showPayload, screen: otherScreenId }), params: { id: "show-1" } },
      res,
      next
    );

    expect(showSeatRepository.countByShow).toHaveBeenCalledWith("show-1");
    expect(Show.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 409,
      code: "SHOW_SCREEN_CHANGE_NOT_ALLOWED_AFTER_INVENTORY",
    }));
  });

  test("normal non-screen Show edits continue to work", async () => {
    const { controller, Show, screenService, showSeatRepository } = loadController({ existingShowSeatCount: 250 });
    const res = createMockResponse();
    Show.findById.mockReturnValue(selectQuery({ _id: "show-1", theatre: THEATRE_ID, screen: SCREEN_ID }));
    Show.findByIdAndUpdate.mockReturnValue(populateQuery({ _id: "show-1", ...showPayload, screen: SCREEN_ID }));

    await controller.updateShow(
      { ...request({ ticketPrice: 225 }), params: { id: "show-1" } },
      res,
      jest.fn()
    );

    expect(screenService.ensureActiveScreenForTheatre).not.toHaveBeenCalled();
    expect(showSeatRepository.countByShow).not.toHaveBeenCalled();
    expect(Show.findByIdAndUpdate).toHaveBeenCalledWith(
      "show-1",
      expect.objectContaining({ ticketPrice: 225 }),
      expect.any(Object)
    );
  });

  test("valid ticketPricing update succeeds", async () => {
    const { controller, Show } = loadController();
    const res = createMockResponse();
    Show.findById.mockReturnValue(selectQuery({ _id: "show-1", theatre: THEATRE_ID, screen: SCREEN_ID }));
    Show.findByIdAndUpdate.mockReturnValue(populateQuery({
      _id: "show-1",
      ...showPayload,
      ticketPricing: {
        STANDARD: 175,
        PREMIUM: 250,
      },
      screen: SCREEN_ID,
    }));

    await controller.updateShow(
      {
        ...request({
          ticketPricing: {
            STANDARD: 175,
            PREMIUM: 250,
          },
        }),
        params: { id: "show-1" },
      },
      res,
      jest.fn()
    );

    expect(Show.findByIdAndUpdate).toHaveBeenCalledWith(
      "show-1",
      expect.objectContaining({
        ticketPricing: {
          STANDARD: 175,
          PREMIUM: 250,
        },
      }),
      expect.any(Object)
    );
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("invalid ticketPricing update is rejected", async () => {
    const { controller, Show } = loadController();
    const res = createMockResponse();
    const next = jest.fn();
    Show.findById.mockReturnValue(selectQuery({ _id: "show-1", theatre: THEATRE_ID, screen: SCREEN_ID }));

    await controller.updateShow(
      {
        ...request({
          ticketPricing: {
            PREMIUM: -10,
          },
        }),
        params: { id: "show-1" },
      },
      res,
      next
    );

    expect(Show.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      code: "INVALID_TICKET_PRICING",
    }));
  });

  test("hard-deleting an initialized Show deletes ShowSeats in the same transaction", async () => {
    const { controller, Show, showSeatRepository, mongooseMock, session } = loadController({ existingShowSeatCount: 250 });
    const res = createMockResponse();
    Show.findById.mockReturnValue(selectQuery({ _id: "show-1", theatre: THEATRE_ID }));
    Show.findByIdAndDelete.mockResolvedValue({ _id: "show-1" });

    await controller.deleteShow(
      { ...request({}), params: { id: "show-1" } },
      res,
      jest.fn()
    );

    expect(mongooseMock.startSession).toHaveBeenCalledTimes(1);
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(showSeatRepository.deleteByShow).toHaveBeenCalledWith("show-1", { session });
    expect(Show.findByIdAndDelete).toHaveBeenCalledWith("show-1", { session });
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("legacy Show deletion without inventory keeps existing hard-delete behavior", async () => {
    const { controller, Show, showSeatRepository, mongooseMock } = loadController({ existingShowSeatCount: 0 });
    const res = createMockResponse();
    Show.findById.mockReturnValue(selectQuery({ _id: "show-1", theatre: THEATRE_ID }));
    Show.findByIdAndDelete.mockResolvedValue({ _id: "show-1" });

    await controller.deleteShow(
      { ...request({}), params: { id: "show-1" } },
      res,
      jest.fn()
    );

    expect(showSeatRepository.deleteByShow).not.toHaveBeenCalled();
    expect(mongooseMock.startSession).not.toHaveBeenCalled();
    expect(Show.findByIdAndDelete).toHaveBeenCalledWith("show-1");
  });

  test("legacy Show creation without Screen keeps submitted totalSeats", async () => {
    const { controller, Show } = loadController();
    const res = createMockResponse();

    await controller.addShow(request({ ...showPayload, totalSeats: 300 }), res, jest.fn());

    expect(Show.lastPayload.totalSeats).toBe(300);
    expect(Show.lastPayload.screen).toBeUndefined();
  });
});
