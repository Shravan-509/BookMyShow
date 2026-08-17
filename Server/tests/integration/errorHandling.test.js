const express = require("express");
const request = require("supertest");
const AppError = require("../../utils/AppError");
const errorHandler = require("../../middlewares/errorHandler");
const notFound = require("../../middlewares/notFound");

const buildApp = () => {
  const app = express();

  app.use(express.json());
  app.get("/bad-request", (req, res, next) => next(new AppError("Bad input", 400, "BAD_INPUT")));
  app.get("/unauthorized", (req, res, next) => next(new AppError("Unauthorized", 401, "UNAUTHORIZED")));
  app.get("/forbidden", (req, res, next) => next(new AppError("Forbidden", 403, "FORBIDDEN")));
  app.get("/conflict", (req, res, next) => next(new AppError("Already exists", 409, "CONFLICT")));
  app.get("/duplicate-payment", (req, res, next) => {
    const err = new Error("E11000 duplicate key");
    err.code = 11000;
    err.keyPattern = { transactionId: 1 };
    next(err);
  });
  app.get("/cast", (req, res, next) => next({ name: "CastError", message: "Cast to ObjectId failed" }));
  app.get("/razorpay", (req, res, next) => {
    res.status(400);
    next({ error: { description: "Razorpay provider internal payload" } });
  });
  app.get("/server-error", (req, res, next) => next(new Error("MONGODB_CONNECTION_STRING=/secret/path token=abc")));
  app.use("/bms/v1", notFound);
  app.use(errorHandler);

  return app;
};

describe("centralized error handling", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = "production";
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  test.each([
    ["/bad-request", 400, "Bad input"],
    ["/unauthorized", 401, "Unauthorized"],
    ["/forbidden", 403, "Forbidden"],
    ["/conflict", 409, "Already exists"],
  ])("returns frontend-compatible %s error", async (path, statusCode, message) => {
    const response = await request(buildApp()).get(path);

    expect(response.status).toBe(statusCode);
    expect(response.body).toEqual(expect.objectContaining({
      success: false,
      message,
    }));
  });

  test("normalizes duplicate payment key conflict", async () => {
    const response = await request(buildApp()).get("/duplicate-payment");

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: "Payment has already been used for a booking",
      code: "PAYMENT_REPLAY",
    });
  });

  test("normalizes invalid MongoDB object id", async () => {
    const response = await request(buildApp()).get("/cast");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid resource identifier",
      code: "INVALID_ID",
    });
  });

  test("sanitizes Razorpay provider errors", async () => {
    const response = await request(buildApp()).get("/razorpay");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Payment gateway request failed",
      code: "PAYMENT_GATEWAY_ERROR",
    });
    expect(JSON.stringify(response.body)).not.toContain("provider internal");
  });

  test("returns JSON 404 for unknown API endpoint", async () => {
    const response = await request(buildApp()).get("/bms/v1/missing");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "API route not found",
      code: "ROUTE_NOT_FOUND",
    });
  });

  test("does not expose stack traces or sensitive internals for 500", async () => {
    const response = await request(buildApp()).get("/server-error");
    const body = JSON.stringify(response.body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
    expect(body).not.toContain("MONGODB_CONNECTION_STRING");
    expect(body).not.toContain("/secret/path");
    expect(body).not.toContain("stack");
    expect(body).not.toContain("token=abc");
  });
});
