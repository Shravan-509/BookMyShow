const mongoose = require("mongoose");
const ShowSeat = require("../../models/showSeatSchema");
const Seat = require("../../models/seatSchema");

const { SEAT_TYPES } = Seat;
const { SHOW_SEAT_STATUS } = ShowSeat;

describe("showSeatSchema", () => {
    const showId = new mongoose.Types.ObjectId();
    const seatId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

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

    test("validates a LOCKED ShowSeat with complete metadata", async () => {
        const lockedAt = new Date("2026-09-16T10:00:00.000Z");
        const lockExpiresAt = new Date("2026-09-16T10:07:00.000Z");
        const showSeat = buildShowSeat({
            status: SHOW_SEAT_STATUS.LOCKED,
            lockOwner: userId,
            lockToken: "token-1",
            lockedAt,
            lockExpiresAt,
        });

        await expect(showSeat.validate()).resolves.toBeUndefined();
        expect(showSeat.status).toBe(SHOW_SEAT_STATUS.LOCKED);
        expect(showSeat.lockOwner).toEqual(userId);
        expect(showSeat.lockToken).toBe("token-1");
        expect(showSeat.lockedAt).toBe(lockedAt);
        expect(showSeat.lockExpiresAt).toBe(lockExpiresAt);
    });

    test("rejects malformed LOCKED ShowSeat metadata", async () => {
        await expect(buildShowSeat({ status: SHOW_SEAT_STATUS.LOCKED }).validate())
            .rejects.toThrow(/lockOwner is required when ShowSeat is LOCKED/);
        await expect(buildShowSeat({
            status: SHOW_SEAT_STATUS.LOCKED,
            lockOwner: userId,
            lockedAt: new Date(),
            lockExpiresAt: new Date(),
        }).validate()).rejects.toThrow(/lockToken is required when ShowSeat is LOCKED/);
        await expect(buildShowSeat({
            status: SHOW_SEAT_STATUS.LOCKED,
            lockOwner: userId,
            lockToken: "token-1",
            lockExpiresAt: new Date(),
        }).validate()).rejects.toThrow(/lockedAt is required when ShowSeat is LOCKED/);
        await expect(buildShowSeat({
            status: SHOW_SEAT_STATUS.LOCKED,
            lockOwner: userId,
            lockToken: "token-1",
            lockedAt: new Date(),
        }).validate()).rejects.toThrow(/lockExpiresAt is required when ShowSeat is LOCKED/);
    });

    test("rejects invalid status values", async () => {
        const showSeat = buildShowSeat({ status: "HELD" });

        await expect(showSeat.validate()).rejects.toThrow(/`HELD` is not a valid enum value/);
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
        expect(ShowSeat.schema.indexes()).toContainEqual([
            { show: 1, seatNumber: 1, status: 1 },
            expect.any(Object),
        ]);
        expect(ShowSeat.schema.indexes()).toContainEqual([
            { show: 1, lockOwner: 1, lockToken: 1 },
            expect.any(Object),
        ]);
        expect(ShowSeat.schema.indexes()).toContainEqual([
            { status: 1, lockExpiresAt: 1 },
            expect.any(Object),
        ]);
    });

    test("keeps lock fields optional for existing documents", async () => {
        const showSeat = buildShowSeat({
            lockOwner: null,
            lockToken: null,
            lockedAt: null,
            lockExpiresAt: null,
        });

        await expect(showSeat.validate()).resolves.toBeUndefined();
        expect(showSeat.lockOwner).toBeNull();
        expect(showSeat.lockToken).toBeNull();
        expect(showSeat.lockedAt).toBeNull();
        expect(showSeat.lockExpiresAt).toBeNull();
    });

    test("adds Phase 5 locking fields without TTL indexes", () => {
        expect(ShowSeat.schema.path("lockOwner")).toBeDefined();
        expect(ShowSeat.schema.path("lockOwner").options.ref).toBe("users");
        expect(ShowSeat.schema.path("lockToken")).toBeDefined();
        expect(ShowSeat.schema.path("lockedAt")).toBeDefined();
        expect(ShowSeat.schema.path("lockExpiresAt")).toBeDefined();
        expect(ShowSeat.schema.path("reservationId")).toBeUndefined();
        expect(ShowSeat.schema.indexes()).not.toContainEqual([
            { lockExpiresAt: 1 },
            expect.objectContaining({ expireAfterSeconds: expect.any(Number) }),
        ]);
    });
});
