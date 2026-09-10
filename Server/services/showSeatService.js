const screenRepository = require("../repositories/screenRepository");
const seatRepository = require("../repositories/seatRepository");
const showSeatRepository = require("../repositories/showSeatRepository");
const ShowSeat = require("../models/showSeatSchema");

const { SHOW_SEAT_STATUS } = ShowSeat;

const SHOW_SEAT_AUDIT_CLASSIFICATION = Object.freeze({
    READY: "READY",
    ALREADY_INITIALIZED: "ALREADY_INITIALIZED",
    INCOMPLETE_SCREEN_LAYOUT: "INCOMPLETE_SCREEN_LAYOUT",
    NO_ACTIVE_SEATS: "NO_ACTIVE_SEATS",
    LEGACY_BOOKED_SEAT_MISMATCH: "LEGACY_BOOKED_SEAT_MISMATCH",
    DUPLICATE_BOOKED_SEAT_LABEL: "DUPLICATE_BOOKED_SEAT_LABEL",
    INACTIVE_BOOKED_SEAT: "INACTIVE_BOOKED_SEAT",
    OTHER_ERROR: "OTHER_ERROR",
});

const normalizeSeatLabel = (value) => (
    typeof value === "string" ? value.trim().toUpperCase() : ""
);

const asIdString = (value) => {
    if (!value) {
        return null;
    }

    const id = value._id || value;
    return id.toString();
};

const createBaseResult = (show) => ({
    classification: SHOW_SEAT_AUDIT_CLASSIFICATION.OTHER_ERROR,
    showId: asIdString(show),
    screenId: asIdString(show?.screen),
    screenCapacity: null,
    activeSeatCount: 0,
    legacyBookedSeatCount: Array.isArray(show?.bookedSeats) ? show.bookedSeats.length : 0,
    existingShowSeatCount: 0,
    expectedShowSeatCount: 0,
    mismatchLabels: [],
    duplicateLabels: [],
    inactiveBookedLabels: [],
    proposedWriteCount: 0,
    warnings: [],
});

const sortSeats = (seats) => [...seats].sort((left, right) => {
    const rowComparison = String(left.row).localeCompare(String(right.row));
    if (rowComparison !== 0) {
        return rowComparison;
    }

    if (left.column !== right.column) {
        return left.column - right.column;
    }

    return String(left.seatNumber).localeCompare(String(right.seatNumber));
});

const indexSeatsByLabel = (seats) => seats.reduce((index, seat) => {
    const label = normalizeSeatLabel(seat.seatNumber);
    if (label) {
        index.set(label, seat);
    }
    return index;
}, new Map());

const classifyLegacyBookedSeats = ({ bookedSeats = [], activeSeats, inactiveSeats }) => {
    const activeByLabel = indexSeatsByLabel(activeSeats);
    const inactiveByLabel = indexSeatsByLabel(inactiveSeats);
    const seenLabels = new Set();
    const bookedSeatLabels = new Set();
    const duplicateLabels = [];
    const mismatchLabels = [];
    const inactiveBookedLabels = [];

    bookedSeats.forEach((originalLabel) => {
        const normalizedLabel = normalizeSeatLabel(originalLabel);

        if (!normalizedLabel) {
            mismatchLabels.push(originalLabel);
            return;
        }

        if (seenLabels.has(normalizedLabel)) {
            duplicateLabels.push(originalLabel);
            return;
        }

        seenLabels.add(normalizedLabel);

        if (activeByLabel.has(normalizedLabel)) {
            bookedSeatLabels.add(normalizedLabel);
            return;
        }

        if (inactiveByLabel.has(normalizedLabel)) {
            inactiveBookedLabels.push(originalLabel);
            return;
        }

        mismatchLabels.push(originalLabel);
    });

    return {
        bookedSeatLabels,
        duplicateLabels,
        mismatchLabels,
        inactiveBookedLabels,
    };
};

const withClassification = (result, classification, extra = {}) => ({
    ...result,
    ...extra,
    classification,
});

const auditShowSeatInitialization = async (show, options = {}) => {
    const result = createBaseResult(show);

    try {
        if (!show?._id || !show?.screen) {
            return withClassification(result, SHOW_SEAT_AUDIT_CLASSIFICATION.INCOMPLETE_SCREEN_LAYOUT, {
                warnings: [...result.warnings, "Show does not reference a Screen."],
            });
        }

        const screenId = asIdString(show.screen);
        const existingShowSeatCount = await showSeatRepository.countByShow(show._id, options);
        const screen = await screenRepository.findById(screenId, options);

        const withExistingCount = {
            ...result,
            screenId,
            existingShowSeatCount,
        };

        if (!screen || !screen.isActive) {
            return withClassification(withExistingCount, SHOW_SEAT_AUDIT_CLASSIFICATION.INCOMPLETE_SCREEN_LAYOUT, {
                warnings: [
                    ...withExistingCount.warnings,
                    screen ? "Screen is inactive." : "Screen was not found.",
                ],
            });
        }

        const seats = await seatRepository.findByScreen(screenId, options);
        const activeSeats = sortSeats(seats.filter((seat) => seat.isActive));
        const inactiveSeats = seats.filter((seat) => !seat.isActive);
        const activeSeatCount = activeSeats.length;
        const expectedShowSeatCount = activeSeatCount;
        const screenResult = {
            ...withExistingCount,
            screenCapacity: screen.capacity,
            activeSeatCount,
            expectedShowSeatCount,
        };

        if (existingShowSeatCount > 0) {
            const warnings = [...screenResult.warnings];
            if (existingShowSeatCount !== expectedShowSeatCount) {
                warnings.push(
                    `Existing ShowSeat count ${existingShowSeatCount} does not match expected active Seat count ${expectedShowSeatCount}.`
                );
            }

            return withClassification(screenResult, SHOW_SEAT_AUDIT_CLASSIFICATION.ALREADY_INITIALIZED, {
                warnings,
            });
        }

        if (activeSeatCount === 0) {
            return withClassification(screenResult, SHOW_SEAT_AUDIT_CLASSIFICATION.NO_ACTIVE_SEATS, {
                warnings: [...screenResult.warnings, "Screen has no active Seats."],
            });
        }

        if (activeSeatCount !== screen.capacity) {
            return withClassification(screenResult, SHOW_SEAT_AUDIT_CLASSIFICATION.INCOMPLETE_SCREEN_LAYOUT, {
                warnings: [
                    ...screenResult.warnings,
                    `Active Seat count ${activeSeatCount} does not match Screen capacity ${screen.capacity}.`,
                ],
            });
        }

        const legacyResult = classifyLegacyBookedSeats({
            bookedSeats: show.bookedSeats || [],
            activeSeats,
            inactiveSeats,
        });

        const mappedResult = {
            ...screenResult,
            ...legacyResult,
            activeSeats,
            proposedWriteCount: activeSeatCount,
        };

        if (legacyResult.duplicateLabels.length > 0) {
            return withClassification(mappedResult, SHOW_SEAT_AUDIT_CLASSIFICATION.DUPLICATE_BOOKED_SEAT_LABEL);
        }

        if (legacyResult.inactiveBookedLabels.length > 0) {
            return withClassification(mappedResult, SHOW_SEAT_AUDIT_CLASSIFICATION.INACTIVE_BOOKED_SEAT);
        }

        if (legacyResult.mismatchLabels.length > 0) {
            return withClassification(mappedResult, SHOW_SEAT_AUDIT_CLASSIFICATION.LEGACY_BOOKED_SEAT_MISMATCH);
        }

        return withClassification(mappedResult, SHOW_SEAT_AUDIT_CLASSIFICATION.READY);
    } catch (error) {
        return withClassification(result, SHOW_SEAT_AUDIT_CLASSIFICATION.OTHER_ERROR, {
            warnings: [...result.warnings, error.message],
            error,
        });
    }
};

const buildShowSeatPayloads = (auditResult) => {
    if (auditResult.classification !== SHOW_SEAT_AUDIT_CLASSIFICATION.READY) {
        return [];
    }

    const bookedSeatLabels = auditResult.bookedSeatLabels || new Set();

    return sortSeats(auditResult.activeSeats || []).map((seat) => {
        const normalizedLabel = normalizeSeatLabel(seat.seatNumber);
        const isBooked = bookedSeatLabels.has(normalizedLabel);

        return {
            show: auditResult.showId,
            seat: seat._id,
            seatNumber: seat.seatNumber,
            row: seat.row,
            column: seat.column,
            seatType: seat.seatType,
            status: isBooked ? SHOW_SEAT_STATUS.BOOKED : SHOW_SEAT_STATUS.AVAILABLE,
            bookedAt: null,
            booking: null,
        };
    });
};

const initializeShowSeats = async (show, options = {}) => {
    const auditResult = await auditShowSeatInitialization(show, options);

    if (auditResult.classification !== SHOW_SEAT_AUDIT_CLASSIFICATION.READY) {
        return {
            ...auditResult,
            initialized: false,
            insertedCount: 0,
        };
    }

    const payloads = buildShowSeatPayloads(auditResult);

    try {
        await showSeatRepository.insertMany(payloads, options);
    } catch (error) {
        return withClassification(auditResult, SHOW_SEAT_AUDIT_CLASSIFICATION.OTHER_ERROR, {
            initialized: false,
            insertedCount: 0,
            warnings: [
                ...auditResult.warnings,
                `ShowSeat initialization failed for Show ${auditResult.showId}: ${error.message}`,
            ],
            error,
        });
    }

    const persistedCount = await showSeatRepository.countByShow(show._id, options);

    if (persistedCount !== auditResult.expectedShowSeatCount) {
        return withClassification(auditResult, SHOW_SEAT_AUDIT_CLASSIFICATION.OTHER_ERROR, {
            initialized: false,
            insertedCount: payloads.length,
            persistedCount,
            warnings: [
                ...auditResult.warnings,
                `Persisted ShowSeat count ${persistedCount} does not match expected count ${auditResult.expectedShowSeatCount}.`,
            ],
        });
    }

    return {
        ...auditResult,
        initialized: true,
        insertedCount: payloads.length,
        persistedCount,
    };
};

module.exports = {
    SHOW_SEAT_AUDIT_CLASSIFICATION,
    auditShowSeatInitialization,
    buildShowSeatPayloads,
    initializeShowSeats,
    normalizeSeatLabel,
};
