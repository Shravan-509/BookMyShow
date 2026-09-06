const mongoose = require("mongoose");
const Seat = require("../../models/seatSchema");
const { SEAT_TYPES } = Seat;

describe("seatSchema", () => {
  const screenId = new mongoose.Types.ObjectId();

  test("validates required Seat fields and normalizes row and seatNumber", async () => {
    const seat = new Seat({
      screen: screenId,
      seatNumber: " a1 ",
      row: " a ",
      column: 1,
      seatType: SEAT_TYPES.STANDARD,
    });

    await expect(seat.validate()).resolves.toBeUndefined();
    expect(seat.seatNumber).toBe("A1");
    expect(seat.row).toBe("A");
    expect(seat.isActive).toBe(true);
  });

  test("requires screen, seatNumber, row, column, and valid seatType", async () => {
    const seat = new Seat({ seatType: "VIP" });

    await expect(seat.validate()).rejects.toThrow(/Path `screen` is required/);
    await expect(seat.validate()).rejects.toThrow(/Path `seatNumber` is required/);
    await expect(seat.validate()).rejects.toThrow(/Path `row` is required/);
    await expect(seat.validate()).rejects.toThrow(/Path `column` is required/);
    await expect(seat.validate()).rejects.toThrow(/`VIP` is not a valid enum value/);
  });

  test("rejects non-positive and non-integer columns", async () => {
    const seat = new Seat({
      screen: screenId,
      seatNumber: "A1",
      row: "A",
      column: 0,
      seatType: SEAT_TYPES.STANDARD,
    });

    await expect(seat.validate()).rejects.toThrow(/positive integer/);
  });

  test("uses timestamps and unique screen-level indexes", () => {
    expect(Seat.schema.options.timestamps).toBe(true);
    expect(Seat.schema.indexes()).toContainEqual([
      { screen: 1, seatNumber: 1 },
      expect.objectContaining({ unique: true }),
    ]);
    expect(Seat.schema.indexes()).toContainEqual([
      { screen: 1, row: 1, column: 1 },
      expect.objectContaining({ unique: true }),
    ]);
  });
});
