const mongoose = require("mongoose");
const ShowSeat = require("../../models/showSeatSchema");
const Seat = require("../../models/seatSchema");

const { SEAT_TYPES } = Seat;
const { SHOW_SEAT_STATUS } = ShowSeat;

describe("showSeatSchema", () => {
    const showId = new mongoose.Types.ObjectId();
    const seatId = new mongoose.Types.ObjectId();

    const buildShowSeat = (overrides = {}) => new ShowSeat({
        show: showId,
        seat: seatId,
        seatNumber: "A1",
        row: "A",
        column: 1,
        seatType: SEAT_TYPES.STANDARD,
        ...overrides,
    });

    test("validates an AVAILABLE ShowSeat", async () => {
        const showSeat = buildShowSeat({
            status: SHOW_SEAT_STATUS.AVAILABLE,
        });

        await expect(showSeat.validate()).resolves.toBeUndefined();
        expect(showSeat.status).toBe(SHOW_SEAT_STATUS.AVAILABLE);
        expect(showSeat.booking).toBeNull();
        expect(showSeat.bookedAt).toBeNull();
    });

    test("validates a BOOKED ShowSeat without requiring booking in Phase 4A", async () => {
        const bookedAt = new Date();
        const showSeat = buildShowSeat({
            status: SHOW_SEAT_STATUS.BOOKED,
            bookedAt,
        });

        await expect(showSeat.validate()).resolves.toBeUndefined();
        expect(showSeat.status).toBe(SHOW_SEAT_STATUS.BOOKED);
        expect(showSeat.booking).toBeNull();
        expect(showSeat.bookedAt).toBe(bookedAt);
    });

    test("defaults status to AVAILABLE", async () => {
        const showSeat = buildShowSeat();

        await expect(showSeat.validate()).resolves.toBeUndefined();
        expect(showSeat.status).toBe(SHOW_SEAT_STATUS.AVAILABLE);
    });

    test("rejects invalid status values", async () => {
        const showSeat = buildShowSeat({ status: "LOCKED" });

        await expect(showSeat.validate()).rejects.toThrow(/`LOCKED` is not a valid enum value/);
    });

    test("normalizes seatNumber and row", async () => {
        const showSeat = buildShowSeat({
            seatNumber: " b12 ",
            row: " b ",
        });

        await expect(showSeat.validate()).resolves.toBeUndefined();
        expect(showSeat.seatNumber).toBe("B12");
        expect(showSeat.row).toBe("B");
    });

    test("rejects non-positive and non-integer columns", async () => {
        await expect(buildShowSeat({ column: 0 }).validate()).rejects.toThrow(/positive integer/);
        await expect(buildShowSeat({ column: 1.5 }).validate()).rejects.toThrow(/positive integer/);
    });

    test("rejects invalid seatType values", async () => {
        const showSeat = buildShowSeat({ seatType: "VIP" });

        await expect(showSeat.validate()).rejects.toThrow(/`VIP` is not a valid enum value/);
    });

    test("uses required refs and snapshot fields", async () => {
        const showSeat = new ShowSeat({});

        await expect(showSeat.validate()).rejects.toThrow(/Path `show` is required/);
        await expect(showSeat.validate()).rejects.toThrow(/Path `seat` is required/);
        await expect(showSeat.validate()).rejects.toThrow(/Path `seatNumber` is required/);
        await expect(showSeat.validate()).rejects.toThrow(/Path `row` is required/);
        await expect(showSeat.validate()).rejects.toThrow(/Path `column` is required/);
        await expect(showSeat.validate()).rejects.toThrow(/Path `seatType` is required/);
    });

    test("declares unique show-seat and query indexes", () => {
        expect(ShowSeat.schema.options.timestamps).toBe(true);
        expect(ShowSeat.schema.indexes()).toContainEqual([
            { show: 1, seat: 1 },
            expect.objectContaining({ unique: true }),
        ]);
        expect(ShowSeat.schema.indexes()).toContainEqual([
            { show: 1, status: 1 },
            expect.any(Object),
        ]);
        expect(ShowSeat.schema.indexes()).toContainEqual([
            { show: 1, seatNumber: 1 },
            expect.any(Object),
        ]);
    });

    test("does not introduce Phase 4 locking fields", () => {
        expect(ShowSeat.schema.path("lockOwner")).toBeUndefined();
        expect(ShowSeat.schema.path("lockExpiresAt")).toBeUndefined();
        expect(ShowSeat.schema.path("reservationId")).toBeUndefined();
    });
});
