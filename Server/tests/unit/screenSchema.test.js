const mongoose = require("mongoose");
const Screen = require("../../models/screenSchema");

describe("screenSchema", () => {
  const theatreId = new mongoose.Types.ObjectId();

  test("validates required Screen fields and defaults", async () => {
    const screen = new Screen({
      theatre: theatreId,
      name: " Screen 1 ",
      screenNumber: 1,
      capacity: 650,
    });

    await expect(screen.validate()).resolves.toBeUndefined();
    expect(screen.name).toBe("Screen 1");
    expect(screen.isActive).toBe(true);
  });

  test("requires theatre, name, screenNumber, and capacity", async () => {
    const screen = new Screen({});

    await expect(screen.validate()).rejects.toThrow(/Path `theatre` is required/);
    await expect(screen.validate()).rejects.toThrow(/Path `name` is required/);
    await expect(screen.validate()).rejects.toThrow(/Path `screenNumber` is required/);
    await expect(screen.validate()).rejects.toThrow(/Path `capacity` is required/);
  });

  test("rejects non-positive and non-integer values", async () => {
    const screen = new Screen({
      theatre: theatreId,
      name: "Screen 1",
      screenNumber: 1.5,
      capacity: 0,
    });

    await expect(screen.validate()).rejects.toThrow(/positive integer/);
  });

  test("uses timestamps and theatre plus screenNumber unique index", () => {
    expect(Screen.schema.options.timestamps).toBe(true);
    expect(Screen.schema.indexes()).toContainEqual([
      { theatre: 1, screenNumber: 1 },
      expect.objectContaining({ unique: true }),
    ]);
  });
});
