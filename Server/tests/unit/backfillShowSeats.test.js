const path = require("path");

const {
    CLASSIFICATIONS,
    parseArgs,
    summarizeShows,
    buildReport,
    createReportPath,
    assertApplyPreflightSafe,
    ensureShowSeatIndexes,
    assertTransactionSupport,
    runShowSeatApply,
    runShowSeatDryRunAudit,
} = require("../../scripts/backfillShowSeats");
const { SHOW_SEAT_AUDIT_CLASSIFICATION } = require("../../services/showSeatService");

const {
    READY,
    ALREADY_INITIALIZED,
    INCOMPLETE_SCREEN_LAYOUT,
    NO_ACTIVE_SEATS,
    LEGACY_BOOKED_SEAT_MISMATCH,
    DUPLICATE_BOOKED_SEAT_LABEL,
    INACTIVE_BOOKED_SEAT,
    OTHER_ERROR,
} = SHOW_SEAT_AUDIT_CLASSIFICATION;

const makeShowRow = (classification, overrides = {}) => ({
    showId: `show-${classification}`,
    classification,
    proposedWriteCount: 0,
    existingShowSeatCount: 0,
    legacyBookedSeatCount: 0,
    warnings: [],
    ...overrides,
});

const queryWithShows = (shows) => {
    const query = {
        populate: jest.fn(() => query),
        sort: jest.fn().mockResolvedValue(shows),
    };
    return query;
};

describe("backfillShowSeats dry-run reporting", () => {
    test("summary counts every classification and aggregate total", () => {
        const rows = CLASSIFICATIONS.map((classification) => makeShowRow(classification));

        const summary = summarizeShows(rows);

        expect(summary.totalShowsAudited).toBe(CLASSIFICATIONS.length);
        CLASSIFICATIONS.forEach((classification) => {
            expect(summary.classificationCounts[classification]).toBe(1);
        });
    });

    test("summary aggregates proposed, existing, legacy, warning, eligible and skipped totals", () => {
        const rows = [
            makeShowRow(READY, {
                proposedWriteCount: 3,
                legacyBookedSeatCount: 1,
            }),
            makeShowRow(ALREADY_INITIALIZED, {
                existingShowSeatCount: 3,
                warnings: ["partial inventory"],
            }),
            makeShowRow(LEGACY_BOOKED_SEAT_MISMATCH, {
                legacyBookedSeatCount: 2,
            }),
        ];

        const summary = summarizeShows(rows);

        expect(summary.totalProposedShowSeatDocuments).toBe(3);
        expect(summary.totalExistingShowSeatDocuments).toBe(3);
        expect(summary.totalLegacyBookedSeatLabels).toBe(3);
        expect(summary.showsWithWarnings).toBe(1);
        expect(summary.eligibleForFutureApply).toBe(1);
        expect(summary.skipped).toBe(2);
    });

    test("summary fails when classification totals do not match audited total", () => {
        const rows = [makeShowRow("UNKNOWN_CLASSIFICATION")];

        expect(() => summarizeShows(rows)).toThrow(/Classification count mismatch/);
    });

    test("report metadata is dry-run and excludes environment secrets", () => {
        const generatedAt = new Date("2026-09-07T10:00:00.000Z");

        const report = buildReport({
            shows: [makeShowRow(READY)],
            generatedAt,
            databaseName: "bookmyshow",
        });

        expect(report.metadata).toEqual({
            generatedAt: "2026-09-07T10:00:00.000Z",
            mode: "DRY_RUN",
            databaseName: "bookmyshow",
            script: "backfillShowSeats.js",
        });
        expect(JSON.stringify(report)).not.toContain("MONGODB_CONNECTION_STRING");
        expect(JSON.stringify(report)).not.toContain("mongodb+srv");
    });

    test("default is dry-run and --apply selects apply mode", () => {
        expect(parseArgs([])).toEqual({ mode: "DRY_RUN" });
        expect(parseArgs(["--apply"])).toEqual({ mode: "APPLY" });
    });

    test("unsupported write flags are rejected", () => {
        expect(() => parseArgs(["--write"])).toThrow(/Only --apply enables writes/);
        expect(() => parseArgs(["--force"])).toThrow(/Only --apply enables writes/);
    });

    test("report path uses scripts report directory and timestamped JSON filename", () => {
        const reportPath = createReportPath(
            new Date("2026-09-07T10:00:00.000Z"),
            path.join("Server", "scripts", "reports")
        );

        expect(reportPath).toBe(path.join(
            "Server",
            "scripts",
            "reports",
            "showseat-audit-2026-09-07T10-00-00-000Z.json"
        ));
    });

    test("one Show audit failure becomes OTHER_ERROR and processing continues", async () => {
        jest.resetModules();
        jest.doMock("fs", () => ({
            mkdirSync: jest.fn(),
            writeFileSync: jest.fn(),
        }));

        const script = require("../../scripts/backfillShowSeats");
        const shows = [
            {
                _id: "show-1",
                movie: { _id: "movie-1", movieName: "Movie 1" },
                theatre: { _id: "theatre-1", name: "Theatre 1" },
                screen: { _id: "screen-1", name: "Screen 1", screenNumber: 1 },
                date: new Date("2026-09-07T00:00:00.000Z"),
                time: "10:00 AM",
                bookedSeats: ["A1"],
            },
            {
                _id: "show-2",
                screen: "screen-2",
                bookedSeats: [],
            },
        ];
        const Show = {
            find: jest.fn(() => queryWithShows(shows)),
        };
        const auditShowSeatInitialization = jest.fn()
            .mockRejectedValueOnce(new Error("audit failed"))
            .mockResolvedValueOnce({
                classification: READY,
                showId: "show-2",
                screenId: "screen-2",
                screenCapacity: 1,
                activeSeatCount: 1,
                legacyBookedSeatCount: 0,
                existingShowSeatCount: 0,
                expectedShowSeatCount: 1,
                proposedWriteCount: 1,
                mismatchLabels: [],
                duplicateLabels: [],
                inactiveBookedLabels: [],
                warnings: [],
            });

        const result = await script.runShowSeatDryRunAudit({
            Show,
            auditShowSeatInitialization,
            logger: { log: jest.fn(), error: jest.fn() },
            generatedAt: new Date("2026-09-07T10:00:00.000Z"),
            databaseName: "bookmyshow",
            reportDir: "/tmp/showseat-reports",
        });

        expect(result.summary.totalShowsAudited).toBe(2);
        expect(result.summary.classificationCounts[OTHER_ERROR]).toBe(1);
        expect(result.summary.classificationCounts[READY]).toBe(1);
        expect(result.summary.totalProposedShowSeatDocuments).toBe(1);
        expect(result.shows[0]).toEqual(expect.objectContaining({
            showId: "show-1",
            classification: OTHER_ERROR,
            errorMessage: "audit failed",
            legacyBookedSeatCount: 1,
        }));
        expect(result.shows[1]).toEqual(expect.objectContaining({
            showId: "show-2",
            classification: READY,
            proposedWriteCount: 1,
        }));
    });

    test("non-ready classifications are counted as skipped", () => {
        const rows = [
            makeShowRow(INCOMPLETE_SCREEN_LAYOUT),
            makeShowRow(NO_ACTIVE_SEATS),
            makeShowRow(DUPLICATE_BOOKED_SEAT_LABEL),
            makeShowRow(INACTIVE_BOOKED_SEAT),
        ];

        const summary = summarizeShows(rows);

        expect(summary.eligibleForFutureApply).toBe(0);
        expect(summary.skipped).toBe(4);
    });

    test("preflight permits READY and ALREADY_INITIALIZED classifications", () => {
        const summary = summarizeShows([
            makeShowRow(READY, { expectedShowSeatCount: 2, proposedWriteCount: 2 }),
            makeShowRow(ALREADY_INITIALIZED, { expectedShowSeatCount: 3, existingShowSeatCount: 3 }),
        ]);

        expect(() => assertApplyPreflightSafe(summary)).not.toThrow();
    });

    test("preflight blocks unsafe classifications before writes", () => {
        const summary = summarizeShows([
            makeShowRow(READY),
            makeShowRow(LEGACY_BOOKED_SEAT_MISMATCH),
        ]);

        expect(() => assertApplyPreflightSafe(summary)).toThrow(/LEGACY_BOOKED_SEAT_MISMATCH/);
    });

    test("index verification succeeds when required indexes exist", async () => {
        const ShowSeat = {
            createIndexes: jest.fn().mockResolvedValue(),
            collection: {
                indexes: jest.fn().mockResolvedValue([
                    { key: { show: 1, seat: 1 }, unique: true },
                    { key: { show: 1, status: 1 } },
                    { key: { show: 1, seatNumber: 1 } },
                ]),
            },
        };

        await expect(ensureShowSeatIndexes(ShowSeat)).resolves.toBeUndefined();
        expect(ShowSeat.createIndexes).toHaveBeenCalled();
    });

    test("missing unique index blocks apply", async () => {
        const ShowSeat = {
            createIndexes: jest.fn().mockResolvedValue(),
            collection: {
                indexes: jest.fn().mockResolvedValue([
                    { key: { show: 1, seat: 1 } },
                    { key: { show: 1, status: 1 } },
                    { key: { show: 1, seatNumber: 1 } },
                ]),
            },
        };

        await expect(ensureShowSeatIndexes(ShowSeat)).rejects.toThrow(/unique ShowSeat index/);
    });

    test("transaction support check requires a successful transactional read", async () => {
        const session = {
            withTransaction: jest.fn(async (callback) => callback()),
            endSession: jest.fn(),
        };
        const mongoose = {
            startSession: jest.fn().mockResolvedValue(session),
        };
        const query = {
            session: jest.fn().mockResolvedValue(null),
        };
        const ShowSeat = {
            exists: jest.fn().mockReturnValue(query),
        };

        await expect(assertTransactionSupport({ mongoose, ShowSeat })).resolves.toBeUndefined();
        expect(mongoose.startSession).toHaveBeenCalled();
        expect(session.withTransaction).toHaveBeenCalled();
        expect(query.session).toHaveBeenCalledWith(session);
        expect(session.endSession).toHaveBeenCalled();
    });

    test("transaction support failure blocks apply", async () => {
        const session = {
            withTransaction: jest.fn().mockRejectedValue(new Error("transactions unsupported")),
            endSession: jest.fn(),
        };

        await expect(assertTransactionSupport({
            mongoose: { startSession: jest.fn().mockResolvedValue(session) },
            ShowSeat: { exists: jest.fn() },
        })).rejects.toThrow(/transactions are required/);
        expect(session.endSession).toHaveBeenCalled();
    });

    test("interrupt handler logs guidance and preserves normal signal interruption", () => {
        const logger = { log: jest.fn() };
        const targetProcess = {
            pid: 123,
            once: jest.fn(),
            removeListener: jest.fn(),
            kill: jest.fn(),
        };
        const { registerInterruptMessage } = require("../../scripts/backfillShowSeats");

        registerInterruptMessage(logger, targetProcess);
        const sigintHandler = targetProcess.once.mock.calls.find(([signal]) => signal === "SIGINT")[1];
        sigintHandler("SIGINT");

        expect(logger.log).toHaveBeenCalledWith("Migration interruption requested.");
        expect(logger.log).toHaveBeenCalledWith("Current in-flight Show transaction will not be treated as successfully migrated unless committed.");
        expect(logger.log).toHaveBeenCalledWith("Re-run DRY_RUN before resuming APPLY.");
        expect(targetProcess.kill).toHaveBeenCalledWith(123, "SIGINT");
    });
});

describe("backfillShowSeats apply mode", () => {
    const makePopulatedQuery = (value) => {
        const query = {
            populate: jest.fn(() => query),
            sort: jest.fn().mockResolvedValue(value),
        };
        return query;
    };

    const makeFindByIdQuery = (value) => {
        const query = {
            populate: jest.fn(() => query),
            then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
        };
        return query;
    };

    const makeSession = () => ({
        withTransaction: jest.fn(async (callback) => callback()),
        endSession: jest.fn(),
    });

    const makeApplyContext = ({
        preShows = [{ _id: "show-1", screen: "screen-1", bookedSeats: ["A1"] }],
        finalShows = [{ _id: "show-1", screen: "screen-1", bookedSeats: ["A1"] }],
        preAuditResults = [{
            classification: READY,
            showId: "show-1",
            screenId: "screen-1",
            expectedShowSeatCount: 2,
            proposedWriteCount: 2,
            existingShowSeatCount: 0,
            legacyBookedSeatCount: 1,
            warnings: [],
        }],
        finalAuditResults = [{
            classification: ALREADY_INITIALIZED,
            showId: "show-1",
            screenId: "screen-1",
            expectedShowSeatCount: 2,
            proposedWriteCount: 0,
            existingShowSeatCount: 2,
            legacyBookedSeatCount: 1,
            warnings: [],
        }],
        initializeResults = [{
            classification: READY,
            initialized: true,
            insertedCount: 2,
            persistedCount: 2,
            expectedShowSeatCount: 2,
        }],
        bookedCounts = [1],
        finalTotalCount = 2,
        finalBookedCount = 1,
    } = {}) => {
        jest.resetModules();
        jest.doMock("fs", () => ({
            mkdirSync: jest.fn(),
            writeFileSync: jest.fn(),
        }));
        const script = require("../../scripts/backfillShowSeats");
        const Show = {
            find: jest.fn()
                .mockReturnValueOnce(makePopulatedQuery(preShows))
                .mockReturnValueOnce(makePopulatedQuery(finalShows)),
            findById: jest.fn((showId) => makeFindByIdQuery({ _id: showId, screen: "screen-1", bookedSeats: ["A1"] })),
        };
        const sessions = [makeSession(), makeSession(), makeSession()];
        const mongoose = {
            startSession: jest.fn()
                .mockResolvedValueOnce(sessions[0])
                .mockResolvedValueOnce(sessions[1])
                .mockResolvedValueOnce(sessions[2]),
        };
        const ShowSeat = {
            createIndexes: jest.fn().mockResolvedValue(),
            collection: {
                indexes: jest.fn().mockResolvedValue([
                    { key: { show: 1, seat: 1 }, unique: true },
                    { key: { show: 1, status: 1 } },
                    { key: { show: 1, seatNumber: 1 } },
                ]),
            },
            exists: jest.fn().mockReturnValue({ session: jest.fn().mockResolvedValue(null) }),
            countDocuments: jest.fn((filter) => {
                if (filter?.show && filter?.status === "BOOKED") {
                    return { session: jest.fn().mockResolvedValue(bookedCounts.shift() || 0) };
                }
                if (filter?.status === "BOOKED") {
                    return Promise.resolve(finalBookedCount);
                }
                return Promise.resolve(finalTotalCount);
            }),
        };
        const auditQueue = [...preAuditResults, ...finalAuditResults];
        const initializeQueue = [...initializeResults];
        const auditShowSeatInitialization = jest.fn().mockImplementation(async () => auditQueue.shift());
        const initializeShowSeats = jest.fn().mockImplementation(async () => {
            const next = initializeQueue.shift();
            if (next instanceof Error) {
                throw next;
            }
            return next;
        });

        return {
            script,
            Show,
            ShowSeat,
            mongoose,
            sessions,
            auditShowSeatInitialization,
            initializeShowSeats,
        };
    };

    test("migrates READY Shows with one transaction per Show and session passthrough", async () => {
        const context = makeApplyContext();
        const { script, ShowSeat, mongoose, sessions, auditShowSeatInitialization, initializeShowSeats } = context;
        const logger = { log: jest.fn(), error: jest.fn() };

        const result = await script.runShowSeatApply({
            ...context,
            logger,
            generatedAt: new Date("2026-09-08T10:00:00.000Z"),
            databaseName: "BookMyShow",
            reportDir: "/tmp/showseat-reports",
        });

        expect(result.metadata.mode).toBe("APPLY");
        expect(mongoose.startSession).toHaveBeenCalledTimes(2);
        expect(sessions[0].withTransaction).toHaveBeenCalledTimes(1);
        expect(sessions[1].withTransaction).toHaveBeenCalledTimes(1);
        expect(sessions[0].endSession).toHaveBeenCalled();
        expect(sessions[1].endSession).toHaveBeenCalled();
        expect(initializeShowSeats).toHaveBeenCalledWith(
            expect.objectContaining({ _id: "show-1" }),
            { session: sessions[1] }
        );
        expect(auditShowSeatInitialization).toHaveBeenCalledTimes(2);
        expect(ShowSeat.createIndexes).toHaveBeenCalled();
        expect(result.summary.showsMigrated).toBe(1);
        expect(result.summary.showSeatsInserted).toBe(2);
        expect(result.summary.bookedShowSeatsCreated).toBe(1);
        expect(result.summary.availableShowSeatsCreated).toBe(1);
        expect(result.summary.totalFinalShowSeatCount).toBe(2);
        expect(logger.log).toHaveBeenCalledWith("[1/1] Show show-1 - MIGRATING - expected 2 seats");
        expect(logger.log).toHaveBeenCalledWith(expect.stringMatching(/^\[1\/1\] Show show-1 - MIGRATED - 2 seats - /));
        expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("Processed: 1/1 | Migrated this run: 1"));
        expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("ShowSeats inserted this run: 2"));
    });

    test("skips ALREADY_INITIALIZED Shows without starting per-show transaction", async () => {
        const context = makeApplyContext({
            preAuditResults: [{
                classification: ALREADY_INITIALIZED,
                showId: "show-1",
                screenId: "screen-1",
                expectedShowSeatCount: 2,
                proposedWriteCount: 0,
                existingShowSeatCount: 2,
                legacyBookedSeatCount: 1,
                warnings: [],
            }],
            finalTotalCount: 2,
            finalBookedCount: 1,
        });
        const logger = { log: jest.fn(), error: jest.fn() };

        const result = await context.script.runShowSeatApply({
            ...context,
            logger,
            generatedAt: new Date("2026-09-08T10:00:00.000Z"),
            databaseName: "BookMyShow",
            reportDir: "/tmp/showseat-reports",
        });

        expect(context.mongoose.startSession).toHaveBeenCalledTimes(1);
        expect(context.initializeShowSeats).not.toHaveBeenCalled();
        expect(result.summary.showsAlreadyInitialized).toBe(1);
        expect(result.summary.showSeatsInserted).toBe(0);
        expect(logger.log).toHaveBeenCalledWith("[1/1] Show show-1 - ALREADY_INITIALIZED - 2 seats");
        expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("Processed: 1/1"));
    });

    test("unsafe preflight blocks apply before index, transaction, or writes", async () => {
        const context = makeApplyContext({
            preAuditResults: [{
                classification: LEGACY_BOOKED_SEAT_MISMATCH,
                showId: "show-1",
                expectedShowSeatCount: 0,
                proposedWriteCount: 0,
                existingShowSeatCount: 0,
                legacyBookedSeatCount: 1,
                warnings: [],
            }],
        });
        const logger = { log: jest.fn(), error: jest.fn() };

        await expect(context.script.runShowSeatApply({
            ...context,
            logger,
            generatedAt: new Date("2026-09-08T10:00:00.000Z"),
            databaseName: "BookMyShow",
            reportDir: "/tmp/showseat-reports",
        })).rejects.toThrow(/Apply blocked/);

        expect(context.ShowSeat.createIndexes).not.toHaveBeenCalled();
        expect(context.mongoose.startSession).not.toHaveBeenCalled();
        expect(context.initializeShowSeats).not.toHaveBeenCalled();
    });

    test("failed Show aborts transaction, records report, and stops subsequent Shows", async () => {
        const context = makeApplyContext({
            preShows: [{ _id: "show-1", screen: "screen-1" }, { _id: "show-2", screen: "screen-2" }],
            finalShows: [],
            preAuditResults: [
                {
                    classification: READY,
                    showId: "show-1",
                    screenId: "screen-1",
                    expectedShowSeatCount: 2,
                    proposedWriteCount: 2,
                    existingShowSeatCount: 0,
                    legacyBookedSeatCount: 0,
                    warnings: [],
                },
                {
                    classification: READY,
                    showId: "show-2",
                    screenId: "screen-2",
                    expectedShowSeatCount: 2,
                    proposedWriteCount: 2,
                    existingShowSeatCount: 0,
                    legacyBookedSeatCount: 0,
                    warnings: [],
                },
            ],
            finalAuditResults: [],
            initializeResults: [new Error("insert failed")],
            finalTotalCount: 0,
            finalBookedCount: 0,
        });
        const logger = { log: jest.fn(), error: jest.fn() };

        await expect(context.script.runShowSeatApply({
            ...context,
            logger,
            generatedAt: new Date("2026-09-08T10:00:00.000Z"),
            databaseName: "BookMyShow",
            reportDir: "/tmp/showseat-reports",
        })).rejects.toThrow(/insert failed/);

        expect(context.initializeShowSeats).toHaveBeenCalledTimes(1);
        expect(context.sessions[1].withTransaction).toHaveBeenCalledTimes(1);
        expect(context.sessions[1].endSession).toHaveBeenCalled();
        expect(context.mongoose.startSession).toHaveBeenCalledTimes(2);
        expect(logger.log).toHaveBeenCalledWith("[1/2] Show show-1 - FAILED - insert failed");
        expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("Failed: 1"));
    });

    test("final verification compares dynamic expected and booked totals", async () => {
        const context = makeApplyContext({
            finalTotalCount: 1,
            finalBookedCount: 1,
        });

        await expect(context.script.runShowSeatApply({
            ...context,
            logger: { log: jest.fn(), error: jest.fn() },
            generatedAt: new Date("2026-09-08T10:00:00.000Z"),
            databaseName: "BookMyShow",
            reportDir: "/tmp/showseat-reports",
        })).rejects.toThrow(/Final ShowSeat count 1 does not match expected 2/);
    });

    test("final verification compares dynamic legacy booked total", async () => {
        const context = makeApplyContext({
            finalBookedCount: 0,
        });

        await expect(context.script.runShowSeatApply({
            ...context,
            logger: { log: jest.fn(), error: jest.fn() },
            generatedAt: new Date("2026-09-08T10:00:00.000Z"),
            databaseName: "BookMyShow",
            reportDir: "/tmp/showseat-reports",
        })).rejects.toThrow(/Final BOOKED ShowSeat count 0 does not match expected 1/);
    });
});
