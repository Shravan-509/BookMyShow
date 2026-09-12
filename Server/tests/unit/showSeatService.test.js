const SHOW_ID = "64b7f4f3f4f3f4f3f4f3f401";
const SCREEN_ID = "64b7f4f3f4f3f4f3f4f3f402";
const SEAT_A1_ID = "64b7f4f3f4f3f4f3f4f3f403";
const SEAT_A2_ID = "64b7f4f3f4f3f4f3f4f3f404";
const SEAT_B1_ID = "64b7f4f3f4f3f4f3f4f3f405";

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
        findAvailabilityByShow: jest.fn(),
        insertMany: jest.fn(),
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

const setupReadyAudit = ({ service, screenRepository, seatRepository, showSeatRepository }, overrides = {}) => {
    screenRepository.findById.mockResolvedValue(overrides.screen || screen());
    seatRepository.findByScreen.mockResolvedValue(overrides.seats || completeSeats());
    showSeatRepository.countByShow.mockResolvedValue(overrides.existingShowSeatCount || 0);
};

describe("showSeatService", () => {
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
});
