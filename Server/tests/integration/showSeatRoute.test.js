const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const AppError = require("../../utils/AppError");
const errorHandler = require("../../middlewares/errorHandler");

const USER_ID = "64b7f4f3f4f3f4f3f4f3f406";

const buildApp = ({ role = "user", userId = USER_ID, serviceError = null } = {}) => {
  jest.resetModules();

  const showSeatService = {
    acquireSeatLock: jest.fn(() => {
      if (serviceError) {
        throw serviceError;
      }

      return Promise.resolve({
        showId: "show-1",
        seats: ["A1"],
        lockToken: "token-1",
        lockExpiresAt: "2026-09-16T10:07:00.000Z",
      });
    }),
    getShowSeatAvailability: jest.fn(() => {
      if (serviceError) {
        throw serviceError;
      }

      return Promise.resolve({
        showId: "show-1",
        screenId: "screen-1",
        screenName: "Screen 1",
        screenNumber: 1,
        capacity: 2,
        layoutStatus: "INITIALIZED",
        seats: [
          {
            showSeatId: "showseat-1",
            seatId: "seat-1",
            seatNumber: "A1",
            row: "A",
            column: 1,
            seatType: "STANDARD",
            status: "AVAILABLE",
          },
        ],
      });
    }),
    refreshSeatLock: jest.fn(() => {
      if (serviceError) {
        throw serviceError;
      }

      return Promise.resolve({
        showId: "show-1",
        seats: ["A1"],
        lockToken: "token-1",
        lockExpiresAt: "2026-09-16T10:14:00.000Z",
      });
    }),
    releaseSeatLock: jest.fn(() => {
      if (serviceError) {
        throw serviceError;
      }

      return Promise.resolve({
        showId: "show-1",
        seats: ["A1"],
        lockToken: "token-1",
        lockExpiresAt: null,
        released: true,
      });
    }),
  };

  jest.doMock("../../services/showSeatService", () => showSeatService);

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.userId = userId;
    req.user = { role };
    next();
  });
  app.use("/shows", require("../../routes/showRoute"));
  app.use(errorHandler);

  return { app, showSeatService };
};

const buildProtectedApp = () => {
  jest.resetModules();
  process.env.JWT_SECRET = "test_secret";

  const showSeatService = {
    acquireSeatLock: jest.fn(),
    getShowSeatAvailability: jest.fn(),
    refreshSeatLock: jest.fn(),
    releaseSeatLock: jest.fn(),
  };
  const User = {
    findById: jest.fn(),
  };

  jest.doMock("../../services/showSeatService", () => showSeatService);
  jest.doMock("../../models/userSchema", () => User);

  const { validateJWT } = require("../../middlewares/authorization");
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/shows", validateJWT, require("../../routes/showRoute"));
  app.use(errorHandler);

  return { app, showSeatService };
};

describe("show seat availability route", () => {
  test("allows customer users to fetch ShowSeat availability", async () => {
    const { app, showSeatService } = buildApp({ role: "user" });

    const response = await request(app).get("/shows/show-1/seats");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Show seats fetched successfully",
      data: expect.objectContaining({
        layoutStatus: "INITIALIZED",
        seats: [expect.objectContaining({ seatNumber: "A1", status: "AVAILABLE" })],
      }),
    });
    expect(showSeatService.getShowSeatAvailability).toHaveBeenCalledWith("show-1");
  });

  test("does not require partner or admin role", async () => {
    const { app } = buildApp({ role: "user" });

    const response = await request(app).get("/shows/show-1/seats");

    expect(response.status).not.toBe(403);
  });

  test("returns normalized errors from the service", async () => {
    const { app } = buildApp({
      serviceError: new AppError("Invalid show identifier", 400, "INVALID_SHOW_ID"),
    });

    const response = await request(app).get("/shows/bad-id/seats");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid show identifier",
      code: "INVALID_SHOW_ID",
    });
  });
});

describe("show seat lock routes", () => {
  test("acquires a seat lock for authenticated route context", async () => {
    const { app, showSeatService } = buildApp();

    const response = await request(app)
      .post("/shows/show-1/seats/lock")
      .send({ seats: ["A1"] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Seat lock acquired successfully",
      data: {
        showId: "show-1",
        seats: ["A1"],
        lockToken: "token-1",
        lockExpiresAt: "2026-09-16T10:07:00.000Z",
      },
    });
    expect(response.body.data).not.toHaveProperty("lockOwner");
	    expect(showSeatService.acquireSeatLock).toHaveBeenCalledWith({
	      showId: "show-1",
	      seats: ["A1"],
	      userId: USER_ID,
	    });
  });

  test("refreshes a seat lock with token and route parameter", async () => {
    const { app, showSeatService } = buildApp();

    const response = await request(app)
      .post("/shows/show-1/seats/refresh")
      .send({ seats: ["A1"], lockToken: "token-1" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Seat lock refreshed successfully");
	    expect(showSeatService.refreshSeatLock).toHaveBeenCalledWith({
	      showId: "show-1",
	      seats: ["A1"],
	      lockToken: "token-1",
	      userId: USER_ID,
	    });
  });

  test("releases a seat lock with token and route parameter", async () => {
    const { app, showSeatService } = buildApp();

    const response = await request(app)
      .post("/shows/show-1/seats/release")
      .send({ seats: ["A1"], lockToken: "token-1" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Seat lock released successfully");
	    expect(showSeatService.releaseSeatLock).toHaveBeenCalledWith({
	      showId: "show-1",
	      seats: ["A1"],
	      lockToken: "token-1",
	      userId: USER_ID,
	    });
  });

  test("release route reports idempotent no-op without claiming a release", async () => {
    const { app, showSeatService } = buildApp();
    showSeatService.releaseSeatLock.mockResolvedValueOnce({
      showId: "show-1",
      seats: ["A1"],
      lockToken: "token-1",
      lockExpiresAt: null,
      released: false,
    });

    const response = await request(app)
      .post("/shows/show-1/seats/release")
      .send({ seats: ["A1"], lockToken: "token-1" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("No active owned seat lock to release");
    expect(response.body.data.released).toBe(false);
  });

  test("returns stable lock errors without leaking ownership metadata", async () => {
    const error = new AppError("Seat lock is not owned by the authenticated user", 403, "SEAT_LOCK_NOT_OWNED");
    error.details = {
      unavailableSeats: ["A1"],
      lockOwner: "user-secret",
      lockToken: "secret-token",
    };
    const { app } = buildApp({ serviceError: error });

    const response = await request(app)
      .post("/shows/show-1/seats/refresh")
      .send({ seats: ["A1"], lockToken: "bad-token" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "Seat lock is not owned by the authenticated user",
      code: "SEAT_LOCK_NOT_OWNED",
    });
    expect(JSON.stringify(response.body)).not.toContain("secret-token");
    expect(JSON.stringify(response.body)).not.toContain("user-secret");
  });

  test("protected show routes reject unauthenticated lock requests through existing auth layer", async () => {
    const { app, showSeatService } = buildProtectedApp();

    const response = await request(app)
      .post("/shows/show-1/seats/lock")
      .send({ seats: ["A1"] });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Unauthorized: No token provided",
    });
    expect(showSeatService.acquireSeatLock).not.toHaveBeenCalled();
  });
});
