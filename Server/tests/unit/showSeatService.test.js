const SHOW_ID = "64b7f4f3f4f3f4f3f4f3f401";
const SCREEN_ID = "64b7f4f3f4f3f4f3f4f3f402";
const SEAT_A1_ID = "64b7f4f3f4f3f4f3f4f3f403";
const SEAT_A2_ID = "64b7f4f3f4f3f4f3f4f3f404";
const SEAT_B1_ID = "64b7f4f3f4f3f4f3f4f3f405";
const USER_ID = "64b7f4f3f4f3f4f3f4f3f406";
const OTHER_USER_ID = "64b7f4f3f4f3f4f3f4f3f407";

const showFindByIdQuery = (value) => ({
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockResolvedValue(value),
});

const loadService = () => {
    jest.resetModules();

    const Show = {
        findById: jest.fn(),
    };
    const screenRepository = {
        findById: jest.fn(),
    };
    const seatRepository = {
        findByScreen: jest.fn(),
    };
    const showSeatRepository = {
        countByShow: jest.fn(),
        acquireLocks: jest.fn(),
        findByShowAndSeatNumbers: jest.fn(),
        findAvailabilityByShow: jest.fn(),
        insertMany: jest.fn(),
        markOwnedLocksBooked: jest.fn(),
        refreshLocks: jest.fn(),
        releaseLocks: jest.fn(),
    };

    jest.doMock("../../models/showSchema", () => Show);
    jest.doMock("../../repositories/screenRepository", () => screenRepository);
    jest.doMock("../../repositories/seatRepository", () => seatRepository);
    jest.doMock("../../repositories/showSeatRepository", () => showSeatRepository);

    return {
        Show,
        screenRepository,
        seatRepository,
        showSeatRepository,
        service: require("../../services/showSeatService"),
    };
};

const show = (overrides = {}) => ({
    _id: SHOW_ID,
    screen: SCREEN_ID,
    bookedSeats: [],
    ...overrides,
});

const screen = (overrides = {}) => ({
    _id: SCREEN_ID,
    name: "Screen 1",
    screenNumber: 1,
    capacity: 3,
    isActive: true,
    ...overrides,
});

const populatedShow = (overrides = {}) => show({
    totalSeats: 3,
    screen: screen(),
    ...overrides,
});

const seat = (overrides = {}) => ({
    _id: SEAT_A1_ID,
    screen: SCREEN_ID,
    seatNumber: "A1",
    row: "A",
    column: 1,
    seatType: "STANDARD",
    isActive: true,
    ...overrides,
});

const completeSeats = () => [
    seat({ _id: SEAT_B1_ID, seatNumber: "B1", row: "B", column: 1, seatType: "RECLINER" }),
    seat({ _id: SEAT_A2_ID, seatNumber: "A2", row: "A", column: 2, seatType: "PREMIUM" }),
    seat({ _id: SEAT_A1_ID, seatNumber: "A1", row: "A", column: 1, seatType: "STANDARD" }),
];

const showSeat = (overrides = {}) => ({
    _id: "64b7f4f3f4f3f4f3f4f3f501",
    seat: SEAT_A1_ID,
    seatNumber: "A1",
    row: "A",
    column: 1,
    seatType: "STANDARD",
    status: "AVAILABLE",
    booking: "booking-should-not-leak",
    bookedAt: new Date("2026-09-11T10:00:00Z"),
    user: "user-should-not-leak",
    transactionId: "pay-should-not-leak",
    orderId: "order-should-not-leak",
    __v: 0,
    createdAt: new Date("2026-09-11T10:00:00Z"),
    updatedAt: new Date("2026-09-11T10:00:00Z"),
    ...overrides,
});

const lockableShowSeatDocs = (overrides = {}) => [
    showSeat({ _id: "showseat-a1", seatNumber: "A1", row: "A", column: 1, ...overrides.A1 }),
    showSeat({ _id: "showseat-a2", seat: SEAT_A2_ID, seatNumber: "A2", row: "A", column: 2, ...overrides.A2 }),
];

const setupReadyAudit = ({ service, screenRepository, seatRepository, showSeatRepository }, overrides = {}) => {
    screenRepository.findById.mockResolvedValue(overrides.screen || screen());
    seatRepository.findByScreen.mockResolvedValue(overrides.seats || completeSeats());
    showSeatRepository.countByShow.mockResolvedValue(overrides.existingShowSeatCount || 0);
};

describe("showSeatService", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    test("classifies complete Screen inventory as READY", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context);

        const result = await service.auditShowSeatInitialization(show());

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.READY);
        expect(result.screenCapacity).toBe(3);
        expect(result.activeSeatCount).toBe(3);
        expect(result.expectedShowSeatCount).toBe(3);
        expect(result.proposedWriteCount).toBe(3);
    });

    test("classifies inactive Screen as INCOMPLETE_SCREEN_LAYOUT", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context, { screen: screen({ isActive: false }) });

        const result = await service.auditShowSeatInitialization(show());

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.INCOMPLETE_SCREEN_LAYOUT);
        expect(result.warnings).toContain("Screen is inactive.");
    });

    test("classifies missing Show screen as INCOMPLETE_SCREEN_LAYOUT", async () => {
        const { service, showSeatRepository } = loadService();

        const result = await service.auditShowSeatInitialization(show({ screen: null }));

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.INCOMPLETE_SCREEN_LAYOUT);
        expect(showSeatRepository.countByShow).not.toHaveBeenCalled();
    });

    test("classifies no active Seats as NO_ACTIVE_SEATS", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context, {
            screen: screen({ capacity: 1 }),
            seats: [seat({ isActive: false })],
        });

        const result = await service.auditShowSeatInitialization(show());

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.NO_ACTIVE_SEATS);
        expect(result.activeSeatCount).toBe(0);
    });

    test("classifies active count below Screen capacity as INCOMPLETE_SCREEN_LAYOUT", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context, {
            screen: screen({ capacity: 4 }),
        });

        const result = await service.auditShowSeatInitialization(show());

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.INCOMPLETE_SCREEN_LAYOUT);
        expect(result.warnings[0]).toMatch(/does not match Screen capacity 4/);
    });

    test("classifies active count above Screen capacity as INCOMPLETE_SCREEN_LAYOUT", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context, {
            screen: screen({ capacity: 2 }),
        });

        const result = await service.auditShowSeatInitialization(show());

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.INCOMPLETE_SCREEN_LAYOUT);
        expect(result.warnings[0]).toMatch(/Active Seat count 3/);
    });

    test("classifies existing ShowSeats as ALREADY_INITIALIZED", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context, { existingShowSeatCount: 3 });

        const result = await service.auditShowSeatInitialization(show());

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.ALREADY_INITIALIZED);
        expect(result.existingShowSeatCount).toBe(3);
        expect(result.expectedShowSeatCount).toBe(3);
        expect(result.warnings).toHaveLength(0);
    });

    test("classifies partial existing ShowSeats as ALREADY_INITIALIZED with warning", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context, { existingShowSeatCount: 2 });

        const result = await service.auditShowSeatInitialization(show());

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.ALREADY_INITIALIZED);
        expect(result.warnings[0]).toMatch(/does not match expected active Seat count 3/);
    });

    test("maps exact legacy booked labels", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context);

        const result = await service.auditShowSeatInitialization(show({ bookedSeats: ["A1"] }));

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.READY);
        expect(result.bookedSeatLabels.has("A1")).toBe(true);
        expect(result.legacyBookedSeatCount).toBe(1);
    });

    test("normalizes lowercase and whitespace legacy booked labels", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context);

        const result = await service.auditShowSeatInitialization(show({ bookedSeats: [" a2 "] }));

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.READY);
        expect(result.bookedSeatLabels.has("A2")).toBe(true);
    });

    test("classifies duplicate normalized booked labels", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context);

        const result = await service.auditShowSeatInitialization(show({ bookedSeats: ["A1", " a1 "] }));

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.DUPLICATE_BOOKED_SEAT_LABEL);
        expect(result.duplicateLabels).toEqual([" a1 "]);
    });

    test("classifies missing legacy booked labels", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context);

        const result = await service.auditShowSeatInitialization(show({ bookedSeats: ["Z9", ""] }));

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.LEGACY_BOOKED_SEAT_MISMATCH);
        expect(result.mismatchLabels).toEqual(["Z9", ""]);
    });

    test("classifies booked labels matching only inactive Seats", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context, {
            screen: screen({ capacity: 3 }),
            seats: [
                ...completeSeats(),
                seat({ _id: "64b7f4f3f4f3f4f3f4f3f406", seatNumber: "C1", row: "C", column: 1, isActive: false }),
            ],
        });

        const result = await service.auditShowSeatInitialization(show({ bookedSeats: ["C1"] }));

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.INACTIVE_BOOKED_SEAT);
        expect(result.inactiveBookedLabels).toEqual(["C1"]);
    });

    test("maps multiple legacy booked seats", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context);

        const result = await service.auditShowSeatInitialization(show({ bookedSeats: ["A1", "B1"] }));

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.READY);
        expect([...result.bookedSeatLabels]).toEqual(["A1", "B1"]);
    });

    test("builds AVAILABLE and BOOKED snapshots deterministically", async () => {
        const context = loadService();
        const { service } = context;
        setupReadyAudit(context);
        const audit = await service.auditShowSeatInitialization(show({ bookedSeats: ["B1"] }));

        const payloads = service.buildShowSeatPayloads(audit);

        expect(payloads.map((payload) => payload.seatNumber)).toEqual(["A1", "A2", "B1"]);
        expect(payloads).toEqual([
            expect.objectContaining({
                show: SHOW_ID,
                seat: SEAT_A1_ID,
                seatNumber: "A1",
                row: "A",
                column: 1,
                seatType: "STANDARD",
                status: "AVAILABLE",
                bookedAt: null,
                booking: null,
            }),
            expect.objectContaining({
                seat: SEAT_A2_ID,
                seatNumber: "A2",
                row: "A",
                column: 2,
                seatType: "PREMIUM",
                status: "AVAILABLE",
                bookedAt: null,
                booking: null,
            }),
            expect.objectContaining({
                seat: SEAT_B1_ID,
                seatNumber: "B1",
                row: "B",
                column: 1,
                seatType: "RECLINER",
                status: "BOOKED",
                bookedAt: null,
                booking: null,
            }),
        ]);
    });

    test("does not build snapshots for non-ready audit results", () => {
        const { service } = loadService();

        const payloads = service.buildShowSeatPayloads({
            classification: service.SHOW_SEAT_AUDIT_CLASSIFICATION.NO_ACTIVE_SEATS,
        });

        expect(payloads).toEqual([]);
    });

    test("initializes READY inventory and verifies persisted count", async () => {
        const context = loadService();
        const { service, showSeatRepository } = context;
        setupReadyAudit(context);
        showSeatRepository.countByShow
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(3);
        showSeatRepository.insertMany.mockResolvedValue([]);

        const result = await service.initializeShowSeats(show());

        expect(result.initialized).toBe(true);
        expect(result.insertedCount).toBe(3);
        expect(result.persistedCount).toBe(3);
        expect(showSeatRepository.insertMany).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ seatNumber: "A1" })]),
            {}
        );
    });

    test("second initialization returns ALREADY_INITIALIZED without inserting", async () => {
        const context = loadService();
        const { service, showSeatRepository } = context;
        setupReadyAudit(context, { existingShowSeatCount: 3 });

        const result = await service.initializeShowSeats(show());

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.ALREADY_INITIALIZED);
        expect(result.initialized).toBe(false);
        expect(showSeatRepository.insertMany).not.toHaveBeenCalled();
    });

    test("surfaces insertion failure without claiming success", async () => {
        const context = loadService();
        const { service, showSeatRepository } = context;
        setupReadyAudit(context);
        showSeatRepository.insertMany.mockRejectedValue(new Error("duplicate key"));

        const result = await service.initializeShowSeats(show());

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.OTHER_ERROR);
        expect(result.initialized).toBe(false);
        expect(result.warnings[0]).toMatch(/duplicate key/);
    });

    test("surfaces count mismatch after insertion", async () => {
        const context = loadService();
        const { service, showSeatRepository } = context;
        setupReadyAudit(context);
        showSeatRepository.countByShow
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(2);
        showSeatRepository.insertMany.mockResolvedValue([]);

        const result = await service.initializeShowSeats(show());

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.OTHER_ERROR);
        expect(result.initialized).toBe(false);
        expect(result.persistedCount).toBe(2);
        expect(result.warnings[0]).toMatch(/does not match expected count 3/);
    });

    test("passes optional session to repository methods", async () => {
        const context = loadService();
        const { service, screenRepository, seatRepository, showSeatRepository } = context;
        const options = { session: "session-1" };
        setupReadyAudit(context);
        showSeatRepository.countByShow
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(3);
        showSeatRepository.insertMany.mockResolvedValue([]);

        await service.initializeShowSeats(show(), options);

        expect(showSeatRepository.countByShow).toHaveBeenNthCalledWith(1, SHOW_ID, options);
        expect(screenRepository.findById).toHaveBeenCalledWith(SCREEN_ID, options);
        expect(seatRepository.findByScreen).toHaveBeenCalledWith(SCREEN_ID, options);
        expect(showSeatRepository.insertMany).toHaveBeenCalledWith(expect.any(Array), options);
        expect(showSeatRepository.countByShow).toHaveBeenNthCalledWith(2, SHOW_ID, options);
    });

    test("returns OTHER_ERROR for unexpected repository failures during audit", async () => {
        const context = loadService();
        const { service, showSeatRepository } = context;
        showSeatRepository.countByShow.mockRejectedValue(new Error("read failed"));

        const result = await service.auditShowSeatInitialization(show());

        expect(result.classification).toBe(service.SHOW_SEAT_AUDIT_CLASSIFICATION.OTHER_ERROR);
        expect(result.warnings).toContain("read failed");
    });

    test("returns initialized customer availability with safe metadata and statuses", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.findAvailabilityByShow.mockResolvedValue([
            showSeat({ _id: "showseat-a1", seatNumber: "A1", row: "A", column: 1, status: "AVAILABLE" }),
            showSeat({ _id: "showseat-a2", seat: SEAT_A2_ID, seatNumber: "A2", row: "A", column: 2, status: "BOOKED" }),
            showSeat({ _id: "showseat-b1", seat: SEAT_B1_ID, seatNumber: "B1", row: "B", column: 1, status: "AVAILABLE" }),
        ]);

        const result = await service.getShowSeatAvailability(SHOW_ID);

        expect(result).toEqual({
            showId: SHOW_ID,
            screenId: SCREEN_ID,
            screenName: "Screen 1",
            screenNumber: 1,
            capacity: 3,
            layoutStatus: "INITIALIZED",
            seats: [
                {
                    showSeatId: "showseat-a1",
                    seatId: SEAT_A1_ID,
                    seatNumber: "A1",
                    row: "A",
                    column: 1,
                    seatType: "STANDARD",
                    status: "AVAILABLE",
                },
                {
                    showSeatId: "showseat-a2",
                    seatId: SEAT_A2_ID,
                    seatNumber: "A2",
                    row: "A",
                    column: 2,
                    seatType: "STANDARD",
                    status: "BOOKED",
                },
                {
                    showSeatId: "showseat-b1",
                    seatId: SEAT_B1_ID,
                    seatNumber: "B1",
                    row: "B",
                    column: 1,
                    seatType: "STANDARD",
                    status: "AVAILABLE",
                },
            ],
        });
        expect(result.seats[0]).not.toHaveProperty("booking");
        expect(result.seats[0]).not.toHaveProperty("bookedAt");
        expect(result.seats[0]).not.toHaveProperty("user");
        expect(result.seats[0]).not.toHaveProperty("transactionId");
        expect(result.seats[0]).not.toHaveProperty("orderId");
        expect(result.seats[0]).not.toHaveProperty("__v");
        expect(result.seats[0]).not.toHaveProperty("createdAt");
        expect(result.seats[0]).not.toHaveProperty("updatedAt");
    });

    test("returns active LOCKED seats as unavailable without exposing lock metadata", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.findAvailabilityByShow.mockResolvedValue([
            showSeat({
                _id: "showseat-a1",
                seatNumber: "A1",
                row: "A",
                column: 1,
                status: "LOCKED",
                lockOwner: "user-1",
                lockToken: "secret-token",
                lockedAt: new Date("2999-01-01T10:00:00.000Z"),
                lockExpiresAt: new Date("2999-01-01T10:07:00.000Z"),
            }),
            showSeat({ _id: "showseat-a2", seat: SEAT_A2_ID, seatNumber: "A2", row: "A", column: 2 }),
            showSeat({ _id: "showseat-b1", seat: SEAT_B1_ID, seatNumber: "B1", row: "B", column: 1 }),
        ]);

        const result = await service.getShowSeatAvailability(SHOW_ID);

        expect(result.seats[0]).toMatchObject({
            seatNumber: "A1",
            status: "BOOKED",
        });
        expect(result.seats[0]).not.toHaveProperty("lockOwner");
        expect(result.seats[0]).not.toHaveProperty("lockToken");
        expect(result.seats[0]).not.toHaveProperty("lockedAt");
        expect(result.seats[0]).not.toHaveProperty("lockExpiresAt");
    });

    test("returns expired LOCKED seats as effectively available", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.findAvailabilityByShow.mockResolvedValue([
            showSeat({
                _id: "showseat-a1",
                seatNumber: "A1",
                row: "A",
                column: 1,
                status: "LOCKED",
                lockExpiresAt: new Date("2000-01-01T10:07:00.000Z"),
            }),
            showSeat({ _id: "showseat-a2", seat: SEAT_A2_ID, seatNumber: "A2", row: "A", column: 2 }),
            showSeat({ _id: "showseat-b1", seat: SEAT_B1_ID, seatNumber: "B1", row: "B", column: 1 }),
        ]);

        const result = await service.getShowSeatAvailability(SHOW_ID);

        expect(result.seats[0]).toMatchObject({
            seatNumber: "A1",
            status: "AVAILABLE",
        });
    });

    test("sorts availability by spreadsheet-style row order, column, and seatNumber", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow({
            screen: screen({ capacity: 5 }),
        })));
        showSeatRepository.findAvailabilityByShow.mockResolvedValue([
            showSeat({ _id: "s-aa2", seatNumber: "AA2", row: "AA", column: 2 }),
            showSeat({ _id: "s-z1", seatNumber: "Z1", row: "Z", column: 1 }),
            showSeat({ _id: "s-a2", seatNumber: "A2", row: "A", column: 2 }),
            showSeat({ _id: "s-a1", seatNumber: "A1", row: "A", column: 1 }),
            showSeat({ _id: "s-aa1", seatNumber: "AA1", row: "AA", column: 1 }),
        ]);

        const result = await service.getShowSeatAvailability(SHOW_ID);

        expect(result.seats.map((seat) => seat.seatNumber)).toEqual(["A1", "A2", "Z1", "AA1", "AA2"]);
    });

    test("rejects malformed Show id", async () => {
        const { service, Show, showSeatRepository } = loadService();

        await expect(service.getShowSeatAvailability("bad-id")).rejects.toMatchObject({
            statusCode: 400,
            code: "INVALID_SHOW_ID",
        });

        expect(Show.findById).not.toHaveBeenCalled();
        expect(showSeatRepository.findAvailabilityByShow).not.toHaveBeenCalled();
    });

    test("returns 404 when Show does not exist", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(null));

        await expect(service.getShowSeatAvailability(SHOW_ID)).rejects.toMatchObject({
            statusCode: 404,
            code: "SHOW_NOT_FOUND",
        });

        expect(showSeatRepository.findAvailabilityByShow).not.toHaveBeenCalled();
    });

    test("returns legacy compatibility response for no-screen Show without inventory", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(show({
            screen: null,
            totalSeats: 150,
        })));

        const result = await service.getShowSeatAvailability(SHOW_ID);

        expect(result).toEqual({
            showId: SHOW_ID,
            screenId: null,
            screenName: null,
            screenNumber: null,
            capacity: 150,
            layoutStatus: "LEGACY",
            seats: [],
        });
        expect(showSeatRepository.findAvailabilityByShow).not.toHaveBeenCalled();
    });

    test("rejects partial inventory instead of returning an initialized layout", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.findAvailabilityByShow.mockResolvedValue([
            showSeat({ seatNumber: "A1", row: "A", column: 1 }),
            showSeat({ seatNumber: "A2", row: "A", column: 2 }),
        ]);

        await expect(service.getShowSeatAvailability(SHOW_ID)).rejects.toMatchObject({
            statusCode: 409,
            code: "SHOWSEAT_INVENTORY_NOT_READY",
        });
    });

    test("returns 1500 seats with one Show query and one ShowSeat query", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow({
            screen: screen({ capacity: 1500 }),
        })));
        showSeatRepository.findAvailabilityByShow.mockResolvedValue(
            Array.from({ length: 1500 }, (_, index) => showSeat({
                _id: `showseat-${index + 1}`,
                seat: `seat-${index + 1}`,
                seatNumber: `A${index + 1}`,
                row: "A",
                column: index + 1,
            }))
        );

        const result = await service.getShowSeatAvailability(SHOW_ID);

        expect(result.seats).toHaveLength(1500);
        expect(Show.findById).toHaveBeenCalledTimes(1);
        expect(showSeatRepository.findAvailabilityByShow).toHaveBeenCalledTimes(1);
        expect(showSeatRepository.insertMany).not.toHaveBeenCalled();
    });

    test("acquires one seat lock with server-generated token and expiry", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.countByShow.mockResolvedValue(3);
        showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(lockableShowSeatDocs().slice(0, 1));
        showSeatRepository.acquireLocks.mockResolvedValue({ verified: true });

        const result = await service.acquireSeatLock({
            showId: SHOW_ID,
            seats: [" a1 "],
            userId: USER_ID,
        });

        const acquireCall = showSeatRepository.acquireLocks.mock.calls[0][0];

        expect(result).toEqual({
            showId: SHOW_ID,
            seats: ["A1"],
            lockToken: expect.stringMatching(/^[a-f0-9]{64}$/),
            lockExpiresAt: acquireCall.lockExpiresAt.toISOString(),
        });
        expect(acquireCall.lockExpiresAt.getTime() - acquireCall.now.getTime()).toBe(7 * 60 * 1000);
        expect(showSeatRepository.acquireLocks).toHaveBeenCalledWith({
            showId: SHOW_ID,
            seatNumbers: ["A1"],
            userId: USER_ID,
            lockToken: result.lockToken,
            now: acquireCall.now,
            lockExpiresAt: acquireCall.lockExpiresAt,
        });
    });

    test("acquires multiple seat locks without exposing ownership metadata", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.countByShow.mockResolvedValue(3);
        showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(lockableShowSeatDocs());
        showSeatRepository.acquireLocks.mockResolvedValue({ verified: true });

        const result = await service.acquireSeatLock({
            showId: SHOW_ID,
            seats: ["A1", "A2"],
            userId: USER_ID,
        });

        expect(result.seats).toEqual(["A1", "A2"]);
        expect(result).not.toHaveProperty("lockOwner");
        expect(result).not.toHaveProperty("lockedAt");
    });

    test("rejects duplicate or invalid acquire seat input", async () => {
        const { service, Show } = loadService();

        await expect(service.acquireSeatLock({
            showId: SHOW_ID,
            seats: ["A1", " a1 "],
            userId: USER_ID,
        })).rejects.toMatchObject({ statusCode: 400, code: "DUPLICATE_SEAT_SELECTION" });

        await expect(service.acquireSeatLock({
            showId: SHOW_ID,
            seats: [""],
            userId: USER_ID,
        })).rejects.toMatchObject({ statusCode: 400, code: "INVALID_SEAT_SELECTION" });
        expect(Show.findById).not.toHaveBeenCalled();
    });

    test("rejects malformed show id and missing Show during acquire", async () => {
        const { service, Show } = loadService();

        await expect(service.acquireSeatLock({
            showId: "bad-id",
            seats: ["A1"],
            userId: USER_ID,
        })).rejects.toMatchObject({ statusCode: 400, code: "INVALID_SHOW_ID" });

        Show.findById.mockReturnValue(showFindByIdQuery(null));
        await expect(service.acquireSeatLock({
            showId: SHOW_ID,
            seats: ["A1"],
            userId: USER_ID,
        })).rejects.toMatchObject({ statusCode: 404, code: "SHOW_NOT_FOUND" });
    });

    test("rejects legacy or incomplete inventory during acquire", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValueOnce(showFindByIdQuery(populatedShow({ screen: null })));

        await expect(service.acquireSeatLock({
            showId: SHOW_ID,
            seats: ["A1"],
            userId: USER_ID,
        })).rejects.toMatchObject({ statusCode: 409, code: "SHOWSEAT_INVENTORY_NOT_READY" });

        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.countByShow.mockResolvedValue(2);
        await expect(service.acquireSeatLock({
            showId: SHOW_ID,
            seats: ["A1"],
            userId: USER_ID,
        })).rejects.toMatchObject({ statusCode: 409, code: "SHOWSEAT_INVENTORY_NOT_READY" });
    });

    test("rejects missing, booked, and active locked seats during acquire", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.countByShow.mockResolvedValue(3);
        showSeatRepository.findByShowAndSeatNumbers
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(lockableShowSeatDocs({ A1: { status: "BOOKED" } }).slice(0, 1))
            .mockResolvedValueOnce(lockableShowSeatDocs({
                A1: { status: "LOCKED", lockExpiresAt: new Date("2999-01-01T10:07:00.000Z") },
            }).slice(0, 1));

        await expect(service.acquireSeatLock({
            showId: SHOW_ID,
            seats: ["A1"],
            userId: USER_ID,
        })).rejects.toMatchObject({ statusCode: 409, code: "SEAT_UNAVAILABLE" });

        await expect(service.acquireSeatLock({
            showId: SHOW_ID,
            seats: ["A1"],
            userId: USER_ID,
        })).rejects.toMatchObject({ statusCode: 409, code: "SEAT_ALREADY_BOOKED" });

        await expect(service.acquireSeatLock({
            showId: SHOW_ID,
            seats: ["A1"],
            userId: USER_ID,
        })).rejects.toMatchObject({ statusCode: 409, code: "SEAT_ALREADY_LOCKED" });
    });

    test("allows expired locks to be reclaimed during acquire and maps repository conflicts", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.countByShow.mockResolvedValue(3);
        showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(lockableShowSeatDocs({
            A1: { status: "LOCKED", lockExpiresAt: new Date("2000-01-01T10:07:00.000Z") },
        }).slice(0, 1));
        showSeatRepository.acquireLocks.mockRejectedValue({ code: "SEAT_LOCK_CONFLICT", details: { missingSeatNumbers: ["A1"] } });

        await expect(service.acquireSeatLock({
            showId: SHOW_ID,
            seats: ["A1"],
            userId: USER_ID,
        })).rejects.toMatchObject({ statusCode: 409, code: "SEAT_LOCK_CONFLICT" });
    });

    test("refreshes an owned active lock and retains the same token", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.countByShow.mockResolvedValue(3);
        showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(lockableShowSeatDocs({
            A1: {
                status: "LOCKED",
                lockOwner: USER_ID,
                lockToken: "token-1",
                lockExpiresAt: new Date("2999-09-16T10:05:00.000Z"),
            },
        }).slice(0, 1));
        showSeatRepository.refreshLocks.mockResolvedValue({ verified: true });

        const result = await service.refreshSeatLock({
            showId: SHOW_ID,
            seats: ["A1"],
            userId: USER_ID,
            lockToken: "token-1",
        });

        const refreshCall = showSeatRepository.refreshLocks.mock.calls[0][0];

        expect(result).toEqual({
            showId: SHOW_ID,
            seats: ["A1"],
            lockToken: "token-1",
            lockExpiresAt: refreshCall.lockExpiresAt.toISOString(),
        });
        expect(refreshCall.lockExpiresAt.getTime() - refreshCall.now.getTime()).toBe(7 * 60 * 1000);
        expect(showSeatRepository.refreshLocks).toHaveBeenCalledWith(expect.objectContaining({
            userId: USER_ID,
            lockToken: "token-1",
            lockExpiresAt: refreshCall.lockExpiresAt,
        }));
    });

    test("rejects refresh for wrong user, wrong token, expired lock, and booked seat", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.countByShow.mockResolvedValue(3);
        showSeatRepository.findByShowAndSeatNumbers
            .mockResolvedValueOnce(lockableShowSeatDocs({
                A1: { status: "LOCKED", lockOwner: OTHER_USER_ID, lockToken: "token-1", lockExpiresAt: new Date("2999-01-01T10:07:00.000Z") },
            }).slice(0, 1))
            .mockResolvedValueOnce(lockableShowSeatDocs({
                A1: { status: "LOCKED", lockOwner: USER_ID, lockToken: "other-token", lockExpiresAt: new Date("2999-01-01T10:07:00.000Z") },
            }).slice(0, 1))
            .mockResolvedValueOnce(lockableShowSeatDocs({
                A1: { status: "LOCKED", lockOwner: USER_ID, lockToken: "token-1", lockExpiresAt: new Date("2000-01-01T10:07:00.000Z") },
            }).slice(0, 1))
            .mockResolvedValueOnce(lockableShowSeatDocs({ A1: { status: "BOOKED" } }).slice(0, 1));

        await expect(service.refreshSeatLock({ showId: SHOW_ID, seats: ["A1"], userId: USER_ID, lockToken: "token-1" }))
            .rejects.toMatchObject({ statusCode: 403, code: "SEAT_LOCK_NOT_OWNED" });
        await expect(service.refreshSeatLock({ showId: SHOW_ID, seats: ["A1"], userId: USER_ID, lockToken: "token-1" }))
            .rejects.toMatchObject({ statusCode: 403, code: "SEAT_LOCK_NOT_OWNED" });
        await expect(service.refreshSeatLock({ showId: SHOW_ID, seats: ["A1"], userId: USER_ID, lockToken: "token-1" }))
            .rejects.toMatchObject({ statusCode: 409, code: "SEAT_LOCK_EXPIRED" });
        await expect(service.refreshSeatLock({ showId: SHOW_ID, seats: ["A1"], userId: USER_ID, lockToken: "token-1" }))
            .rejects.toMatchObject({ statusCode: 409, code: "SEAT_ALREADY_BOOKED" });
        expect(showSeatRepository.refreshLocks).not.toHaveBeenCalled();
    });

    test("releases owned locks and clears via repository", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.countByShow.mockResolvedValue(3);
        showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(lockableShowSeatDocs({
            A1: { status: "LOCKED", lockOwner: USER_ID, lockToken: "token-1" },
        }).slice(0, 1));
        showSeatRepository.releaseLocks.mockResolvedValue({ modifiedCount: 1 });

        const result = await service.releaseSeatLock({
            showId: SHOW_ID,
            seats: ["A1"],
            userId: USER_ID,
            lockToken: "token-1",
        });

        expect(result).toEqual({
            showId: SHOW_ID,
            seats: ["A1"],
            lockToken: "token-1",
            lockExpiresAt: null,
            released: true,
        });
        expect(showSeatRepository.releaseLocks).toHaveBeenCalledWith({
            showId: SHOW_ID,
            seatNumbers: ["A1"],
            userId: USER_ID,
            lockToken: "token-1",
        });
    });

    test("release is a safe no-op for already released seats but rejects wrong owner, wrong token, and booked seats", async () => {
        const { service, Show, showSeatRepository } = loadService();
        Show.findById.mockReturnValue(showFindByIdQuery(populatedShow()));
        showSeatRepository.countByShow.mockResolvedValue(3);
        showSeatRepository.findByShowAndSeatNumbers
            .mockResolvedValueOnce(lockableShowSeatDocs().slice(0, 1))
            .mockResolvedValueOnce(lockableShowSeatDocs({
                A1: { status: "LOCKED", lockOwner: OTHER_USER_ID, lockToken: "token-1" },
            }).slice(0, 1))
            .mockResolvedValueOnce(lockableShowSeatDocs({
                A1: { status: "LOCKED", lockOwner: USER_ID, lockToken: "other-token" },
            }).slice(0, 1))
            .mockResolvedValueOnce(lockableShowSeatDocs({ A1: { status: "BOOKED" } }).slice(0, 1));

        await expect(service.releaseSeatLock({ showId: SHOW_ID, seats: ["A1"], userId: USER_ID, lockToken: "token-1" }))
            .resolves.toMatchObject({ released: false });
        await expect(service.releaseSeatLock({ showId: SHOW_ID, seats: ["A1"], userId: USER_ID, lockToken: "token-1" }))
            .rejects.toMatchObject({ statusCode: 403, code: "SEAT_LOCK_NOT_OWNED" });
        await expect(service.releaseSeatLock({ showId: SHOW_ID, seats: ["A1"], userId: USER_ID, lockToken: "token-1" }))
            .rejects.toMatchObject({ statusCode: 403, code: "SEAT_LOCK_NOT_OWNED" });
        await expect(service.releaseSeatLock({ showId: SHOW_ID, seats: ["A1"], userId: USER_ID, lockToken: "token-1" }))
            .rejects.toMatchObject({ statusCode: 409, code: "SEAT_ALREADY_BOOKED" });
    });

    test("validates initialized booking selection only with an active owned lock", async () => {
        const { service, showSeatRepository } = loadService();
        const activeLock = lockableShowSeatDocs({
            A1: {
                status: "LOCKED",
                lockOwner: USER_ID,
                lockToken: "token-1",
                lockExpiresAt: new Date("2999-01-01T10:07:00.000Z"),
            },
        }).slice(0, 1);

        showSeatRepository.countByShow.mockResolvedValue(3);
        showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(activeLock);

        const result = await service.validateLockedBookingSeatSelection(
            populatedShow(),
            [" a1 "],
            { userId: USER_ID, lockToken: "token-1" }
        );

        expect(result.mode).toBe(service.BOOKING_SEAT_VALIDATION_MODE.INITIALIZED);
        expect(result.seats).toEqual(["A1"]);
        expect(result.showSeats).toBe(activeLock);
    });

    test("maps expired initialized booking lock after captured payment to stable recovery code", async () => {
        const { service, showSeatRepository } = loadService();
        showSeatRepository.countByShow.mockResolvedValue(3);
        showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(lockableShowSeatDocs({
            A1: {
                status: "LOCKED",
                lockOwner: USER_ID,
                lockToken: "token-1",
                lockExpiresAt: new Date("2000-01-01T10:07:00.000Z"),
            },
        }).slice(0, 1));

        await expect(service.validateLockedBookingSeatSelection(
            populatedShow(),
            ["A1"],
            { userId: USER_ID, lockToken: "token-1", paymentCaptured: true }
        )).rejects.toMatchObject({
            statusCode: 409,
            code: "PAYMENT_CAPTURED_SEAT_LOCK_EXPIRED",
        });
    });

    test("marks active owned locks as booked for a persisted booking", async () => {
        const { service, showSeatRepository } = loadService();
        const bookedAt = new Date("2026-09-16T10:01:00.000Z");
        const now = new Date("2026-09-16T10:00:00.000Z");
        showSeatRepository.markOwnedLocksBooked.mockResolvedValue({ modifiedCount: 1 });

        await service.markLockedSeatsBookedForBooking({
            showId: SHOW_ID,
            seatNumbers: [" a1 "],
            userId: USER_ID,
            lockToken: "token-1",
            bookingId: "booking-1",
            bookedAt,
            now,
        }, { session: "session-1" });

        expect(showSeatRepository.markOwnedLocksBooked).toHaveBeenCalledWith({
            showId: SHOW_ID,
            seatNumbers: ["A1"],
            userId: USER_ID,
            lockToken: "token-1",
            bookingId: "booking-1",
            bookedAt,
            now,
        }, { session: "session-1" });
    });
});
