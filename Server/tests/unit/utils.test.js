const AppError = require("../../utils/AppError");
const asyncHandler = require("../../utils/asyncHandler");
const { generateBookingId } = require("../../utils/idGenerator");

describe("backend utility helpers", () => {
  test("AppError stores operational status and safe code", () => {
    const err = new AppError("Not found", 404, "NOT_FOUND");

    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.isOperational).toBe(true);
  });

  test("asyncHandler forwards rejected async errors to next", async () => {
    const err = new Error("boom");
    const next = jest.fn();

    await asyncHandler(async () => {
      throw err;
    })({}, {}, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  test("generateBookingId returns seven uppercase alphanumeric characters", () => {
    expect(generateBookingId()).toMatch(/^[A-Z0-9]{7}$/);
  });
});
