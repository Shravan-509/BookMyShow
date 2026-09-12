const express = require("express");
const request = require("supertest");
const AppError = require("../../utils/AppError");
const errorHandler = require("../../middlewares/errorHandler");

const buildApp = ({ role = "user", serviceError = null } = {}) => {
  jest.resetModules();

  const showSeatService = {
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
  };

  jest.doMock("../../services/showSeatService", () => showSeatService);

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { role };
    next();
  });
  app.use("/shows", require("../../routes/showRoute"));
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
