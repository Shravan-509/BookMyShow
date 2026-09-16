const loadRepository = ({ session = null } = {}) => {
    jest.resetModules();

    const sort = jest.fn().mockReturnValue("sorted-query");
    const lean = jest.fn().mockReturnValue("lean-query");
    const ShowSeat = {
        find: jest.fn().mockReturnValue({ sort, lean }),
        findOne: jest.fn().mockReturnValue("find-one-query"),
        countDocuments: jest.fn().mockReturnValue("count-query"),
        updateMany: jest.fn().mockResolvedValue({ matchedCount: 0, modifiedCount: 0 }),
        insertMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockReturnValue("delete-query"),
        SHOW_SEAT_STATUS: {
            AVAILABLE: "AVAILABLE",
            LOCKED: "LOCKED",
            BOOKED: "BOOKED",
        },
    };
    const transactionSession = session || {
        withTransaction: jest.fn(async (callback) => callback()),
        endSession: jest.fn(),
    };
    const mongoose = {
        startSession: jest.fn().mockResolvedValue(transactionSession),
    };

    jest.doMock("mongoose", () => mongoose);
    jest.doMock("../../models/showSeatSchema", () => ShowSeat);

    return {
        repository: require("../../repositories/showSeatRepository"),
        mongoose,
        session: transactionSession,
        ShowSeat,
        sort,
        lean,
    };
};

describe("showSeatRepository", () => {
    test("queries ShowSeats by Show in row and column order", () => {
        const { repository, ShowSeat, sort } = loadRepository();

        const result = repository.findByShow("show-1");

        expect(result).toBe("sorted-query");
        expect(ShowSeat.find).toHaveBeenCalledWith({ show: "show-1" }, null, {});
        expect(sort).toHaveBeenCalledWith({ row: 1, column: 1 });
    });

    test("queries projected ShowSeat availability without populating", () => {
        const { repository, ShowSeat, lean } = loadRepository();

        const result = repository.findAvailabilityByShow("show-1");

        expect(result).toBe("lean-query");
        expect(ShowSeat.find).toHaveBeenCalledWith(
            { show: "show-1" },
            "_id seat seatNumber row column seatType status lockExpiresAt",
            {}
        );
        expect(lean).toHaveBeenCalledTimes(1);
    });

    test("queries ShowSeats by Show and status in row and column order", () => {
        const { repository, ShowSeat, sort } = loadRepository();

        const result = repository.findByShowAndStatus("show-1", "AVAILABLE");

        expect(result).toBe("sorted-query");
        expect(ShowSeat.find).toHaveBeenCalledWith(
            { show: "show-1", status: "AVAILABLE" },
            null,
            {}
        );
        expect(sort).toHaveBeenCalledWith({ row: 1, column: 1 });
    });

    test("counts ShowSeats by Show", () => {
        const { repository, ShowSeat } = loadRepository();

        const result = repository.countByShow("show-1");

        expect(result).toBe("count-query");
        expect(ShowSeat.countDocuments).toHaveBeenCalledWith({ show: "show-1" }, {});
    });

    test("finds a ShowSeat by Show and physical Seat", () => {
        const { repository, ShowSeat } = loadRepository();

        const result = repository.findByShowAndSeat("show-1", "seat-1");

        expect(result).toBe("find-one-query");
        expect(ShowSeat.findOne).toHaveBeenCalledWith(
            { show: "show-1", seat: "seat-1" },
            null,
            {}
        );
    });

    test("passes session-capable options to read operations", () => {
        const { repository, ShowSeat } = loadRepository();
        const options = { session: "session-1" };

        repository.findByShow("show-1", options);
        repository.findAvailabilityByShow("show-1", options);
        repository.findByShowAndStatus("show-1", "BOOKED", options);
        repository.countByShow("show-1", options);
        repository.findByShowAndSeat("show-1", "seat-1", options);

        expect(ShowSeat.find).toHaveBeenNthCalledWith(1, { show: "show-1" }, null, options);
        expect(ShowSeat.find).toHaveBeenNthCalledWith(
            2,
            { show: "show-1" },
            "_id seat seatNumber row column seatType status lockExpiresAt",
            options
        );
        expect(ShowSeat.find).toHaveBeenNthCalledWith(
            3,
            { show: "show-1", status: "BOOKED" },
            null,
            options
        );
        expect(ShowSeat.countDocuments).toHaveBeenCalledWith({ show: "show-1" }, options);
        expect(ShowSeat.findOne).toHaveBeenCalledWith(
            { show: "show-1", seat: "seat-1" },
            null,
            options
        );
    });

    test("inserts many ShowSeats with ordered writes and optional session", async () => {
        const { repository, ShowSeat } = loadRepository();
        const payloads = [{ show: "show-1", seat: "seat-1" }];

        await repository.insertMany(payloads, { session: "session-1" });

        expect(ShowSeat.insertMany).toHaveBeenCalledWith(payloads, {
            ordered: true,
            session: "session-1",
        });
    });

    test("deletes ShowSeats by Show with optional session", () => {
        const { repository, ShowSeat } = loadRepository();

        const result = repository.deleteByShow("show-1", { session: "session-1" });

        expect(result).toBe("delete-query");
        expect(ShowSeat.deleteMany).toHaveBeenCalledWith(
            { show: "show-1" },
            { session: "session-1" }
        );
    });

    test("acquires one ShowSeat lock transactionally", async () => {
        const { repository, ShowSeat, mongoose, session } = loadRepository();
        const now = new Date("2026-09-16T10:00:00.000Z");
        const lockExpiresAt = new Date("2026-09-16T10:07:00.000Z");
        ShowSeat.find.mockResolvedValueOnce([
            { seatNumber: "A1", status: "LOCKED", lockToken: "token-1" },
        ]);

        const result = await repository.acquireLocks({
            showId: "show-1",
            seatNumbers: [" a1 "],
            userId: "user-1",
            lockToken: "token-1",
            now,
            lockExpiresAt,
        });

        expect(mongoose.startSession).toHaveBeenCalledTimes(1);
        expect(session.withTransaction).toHaveBeenCalledTimes(1);
        expect(session.endSession).toHaveBeenCalledTimes(1);
        expect(ShowSeat.updateMany).toHaveBeenCalledWith(
            {
                show: "show-1",
                seatNumber: { $in: ["A1"] },
                status: { $ne: "BOOKED" },
                $or: [
                    { status: "AVAILABLE" },
                    { status: "LOCKED", lockExpiresAt: { $lte: now } },
                    { status: "LOCKED", lockOwner: "user-1", lockToken: "token-1" },
                ],
            },
            {
                $set: {
                    status: "LOCKED",
                    lockOwner: "user-1",
                    lockToken: "token-1",
                    lockedAt: now,
                },
                $max: {
                    lockExpiresAt,
                },
                $unset: {
                    booking: "",
                    bookedAt: "",
                },
            },
            { session }
        );
        expect(result.verified).toBe(true);
    });

    test("acquires multiple locks with a caller-provided session", async () => {
        const externalSession = { id: "session-1" };
        const { repository, ShowSeat, mongoose } = loadRepository();
        ShowSeat.find.mockResolvedValueOnce([{ seatNumber: "A1" }, { seatNumber: "A2" }]);

        await repository.acquireLocks({
            showId: "show-1",
            seatNumbers: ["A1", "A2"],
            userId: "user-1",
            lockToken: "token-1",
            now: new Date("2026-09-16T10:00:00.000Z"),
            lockExpiresAt: new Date("2026-09-16T10:07:00.000Z"),
        }, { session: externalSession });

        expect(mongoose.startSession).not.toHaveBeenCalled();
        expect(ShowSeat.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({ seatNumber: { $in: ["A1", "A2"] } }),
            expect.any(Object),
            { session: externalSession }
        );
    });

    test("BOOKED seats cannot lock and failed acquisition reports conflict", async () => {
        const { repository, ShowSeat } = loadRepository();
        ShowSeat.find.mockResolvedValueOnce([]);

        await expect(repository.acquireLocks({
            showId: "show-1",
            seatNumbers: ["A1"],
            userId: "user-1",
            lockToken: "token-1",
            now: new Date("2026-09-16T10:00:00.000Z"),
            lockExpiresAt: new Date("2026-09-16T10:07:00.000Z"),
        })).rejects.toMatchObject({ code: "SEAT_LOCK_CONFLICT" });

        expect(ShowSeat.updateMany.mock.calls[0][0]).toMatchObject({
            status: { $ne: "BOOKED" },
        });
    });

    test("expired locks are reclaimable and same owner-token retry is idempotent", async () => {
        const { repository, ShowSeat } = loadRepository();
        const now = new Date("2026-09-16T10:00:00.000Z");
        ShowSeat.find.mockResolvedValueOnce([{ seatNumber: "A1" }]);

        await repository.acquireLocks({
            showId: "show-1",
            seatNumbers: ["A1"],
            userId: "user-1",
            lockToken: "token-1",
            now,
            lockExpiresAt: new Date("2026-09-16T10:07:00.000Z"),
        });

        expect(ShowSeat.updateMany.mock.calls[0][0].$or).toEqual([
            { status: "AVAILABLE" },
            { status: "LOCKED", lockExpiresAt: { $lte: now } },
            { status: "LOCKED", lockOwner: "user-1", lockToken: "token-1" },
        ]);
    });

    test("same user with a different token and forged tokens cannot take over active locks", async () => {
        const { repository, ShowSeat } = loadRepository();
        ShowSeat.find
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        await expect(repository.acquireLocks({
            showId: "show-1",
            seatNumbers: ["A1"],
            userId: "user-1",
            lockToken: "different-token",
            now: new Date("2026-09-16T10:00:00.000Z"),
            lockExpiresAt: new Date("2026-09-16T10:07:00.000Z"),
        })).rejects.toMatchObject({ code: "SEAT_LOCK_CONFLICT" });

        await expect(repository.acquireLocks({
            showId: "show-1",
            seatNumbers: ["A1"],
            userId: "attacker",
            lockToken: "token-1",
            now: new Date("2026-09-16T10:00:00.000Z"),
            lockExpiresAt: new Date("2026-09-16T10:07:00.000Z"),
        })).rejects.toMatchObject({ code: "SEAT_LOCK_CONFLICT" });
    });

    test("overlapping multi-seat conflict is all-or-nothing inside the transaction", async () => {
        const session = {
            withTransaction: jest.fn(async (callback) => callback()),
            endSession: jest.fn(),
        };
        const { repository, ShowSeat } = loadRepository({ session });
        ShowSeat.find.mockResolvedValueOnce([{ seatNumber: "A1" }]);

        await expect(repository.acquireLocks({
            showId: "show-1",
            seatNumbers: ["A1", "A2"],
            userId: "user-1",
            lockToken: "token-1",
            now: new Date("2026-09-16T10:00:00.000Z"),
            lockExpiresAt: new Date("2026-09-16T10:07:00.000Z"),
        })).rejects.toMatchObject({
            code: "SEAT_LOCK_CONFLICT",
            details: expect.objectContaining({
                missingSeatNumbers: ["A2"],
            }),
        });
        expect(session.withTransaction).toHaveBeenCalledTimes(1);
        expect(session.endSession).toHaveBeenCalledTimes(1);
    });

    test("verifies active lock ownership for every requested seat", async () => {
        const { repository, ShowSeat } = loadRepository();
        const now = new Date("2026-09-16T10:00:00.000Z");
        ShowSeat.find.mockResolvedValueOnce([{ seatNumber: "A1" }, { seatNumber: "A2" }]);

        const result = await repository.verifyLockOwnership({
            showId: "show-1",
            seatNumbers: ["A1", "A2"],
            userId: "user-1",
            lockToken: "token-1",
            now,
        }, { session: "session-1" });

        expect(ShowSeat.find).toHaveBeenCalledWith(
            {
                show: "show-1",
                seatNumber: { $in: ["A1", "A2"] },
                status: "LOCKED",
                lockOwner: "user-1",
                lockToken: "token-1",
                lockExpiresAt: { $gt: now },
            },
            null,
            { session: "session-1" }
        );
        expect(result.verified).toBe(true);
    });

    test("verify reports missing seats for wrong owner, wrong token, expired lock, or absent seats", async () => {
        const { repository, ShowSeat } = loadRepository();
        ShowSeat.find.mockResolvedValueOnce([{ seatNumber: "A1" }]);

        const result = await repository.verifyLockOwnership({
            showId: "show-1",
            seatNumbers: ["A1", "A2"],
            userId: "wrong-user",
            lockToken: "wrong-token",
            now: new Date("2026-09-16T10:00:00.000Z"),
        });

        expect(result.verified).toBe(false);
        expect(result.missingSeatNumbers).toEqual(["A2"]);
    });

    test("refreshes only active owned locks using a server-authoritative expiry", async () => {
        const { repository, ShowSeat, session } = loadRepository();
        const now = new Date("2026-09-16T10:00:00.000Z");
        const lockExpiresAt = new Date("2026-09-16T10:07:00.000Z");
        ShowSeat.find.mockResolvedValueOnce([{ seatNumber: "A1" }]);

        await repository.refreshLocks({
            showId: "show-1",
            seatNumbers: ["A1"],
            userId: "user-1",
            lockToken: "token-1",
            now,
            lockExpiresAt,
        });

        expect(ShowSeat.updateMany).toHaveBeenCalledWith(
            {
                show: "show-1",
                seatNumber: { $in: ["A1"] },
                status: "LOCKED",
                lockOwner: "user-1",
                lockToken: "token-1",
                lockExpiresAt: { $gt: now },
            },
            { $set: { lockExpiresAt } },
            { session }
        );
    });

    test("wrong owner, wrong token, or expired lock cannot refresh", async () => {
        const { repository, ShowSeat } = loadRepository();
        ShowSeat.find.mockResolvedValueOnce([]);

        await expect(repository.refreshLocks({
            showId: "show-1",
            seatNumbers: ["A1"],
            userId: "wrong-user",
            lockToken: "wrong-token",
            now: new Date("2026-09-16T10:00:00.000Z"),
            lockExpiresAt: new Date("2026-09-16T10:07:00.000Z"),
        })).rejects.toMatchObject({ code: "SEAT_LOCK_CONFLICT" });
    });

    test("releases owned locks and clears metadata without touching booked or foreign locks", () => {
        const { repository, ShowSeat } = loadRepository();

        repository.releaseLocks({
            showId: "show-1",
            seatNumbers: ["A1"],
            userId: "user-1",
            lockToken: "token-1",
        }, { session: "session-1" });

        expect(ShowSeat.updateMany).toHaveBeenCalledWith(
            {
                show: "show-1",
                seatNumber: { $in: ["A1"] },
                status: "LOCKED",
                lockOwner: "user-1",
                lockToken: "token-1",
            },
            {
                $set: {
                    status: "AVAILABLE",
                    lockOwner: null,
                    lockToken: null,
                    lockedAt: null,
                    lockExpiresAt: null,
                },
            },
            { session: "session-1" }
        );
    });
});
