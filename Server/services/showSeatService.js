const mongoose = require("mongoose");
const screenRepository = require("../repositories/screenRepository");
const seatRepository = require("../repositories/seatRepository");
const showSeatRepository = require("../repositories/showSeatRepository");
const Show = require("../models/showSchema");
const ShowSeat = require("../models/showSeatSchema");
const AppError = require("../utils/AppError");

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

const SHOW_SEAT_LAYOUT_STATUS = Object.freeze({
    INITIALIZED: "INITIALIZED",
    LEGACY: "LEGACY",
});

const BOOKING_SEAT_VALIDATION_MODE = Object.freeze({
    INITIALIZED: "INITIALIZED",
    LEGACY: "LEGACY",
});

const SHOW_SEAT_RESPONSE_STATUSES = new Set(Object.values(SHOW_SEAT_STATUS));

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

const ensureValidObjectId = (id, code = "INVALID_SHOW_ID") => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid show identifier", 400, code);
    }
};

const rowLabelToNumber = (row) => {
    const label = normalizeSeatLabel(row);
    if (!/^[A-Z]+$/.test(label)) {
        return Number.MAX_SAFE_INTEGER;
    }

    return [...label].reduce((total, char) => (
        total * 26 + char.charCodeAt(0) - 64
    ), 0);
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
    const leftRowOrder = rowLabelToNumber(left.row);
    const rightRowOrder = rowLabelToNumber(right.row);
    const rowComparison = leftRowOrder - rightRowOrder
        || String(left.row).localeCompare(String(right.row));
    if (rowComparison !== 0) {
        return rowComparison;
    }

    if (left.column !== right.column) {
        return left.column - right.column;
    }

    return String(left.seatNumber).localeCompare(String(right.seatNumber));
});

const sanitizeShowSeatForAvailability = (showSeat) => ({
    showSeatId: asIdString(showSeat),
    seatId: asIdString(showSeat.seat),
    seatNumber: showSeat.seatNumber,
    row: showSeat.row,
    column: showSeat.column,
    seatType: showSeat.seatType,
    status: SHOW_SEAT_RESPONSE_STATUSES.has(showSeat.status)
        ? showSeat.status
        : SHOW_SEAT_STATUS.AVAILABLE,
});

const getScreenLabel = (screen) => {
    if (!screen) {
        return null;
    }

    if (screen.name) {
        return screen.name;
    }

    return screen.screenNumber ? `Screen ${screen.screenNumber}` : null;
};

const indexSeatsByLabel = (seats) => seats.reduce((index, seat) => {
    const label = normalizeSeatLabel(seat.seatNumber);
    if (label) {
        index.set(label, seat);
    }
    return index;
}, new Map());

const createSeatConflictError = ({
    unavailableSeats,
    availableSeats,
    allBookedSeats,
    message = "Some seats were already booked. Please choose different seats.",
    code = "SEAT_ALREADY_BOOKED",
}) => {
    const error = new AppError(message, 409, code);
    error.details = {
        availableSeats,
        unavailableSeats,
        allBookedSeats,
    };
    return error;
};

const normalizeSeatSelection = (seats) => {
    if (!Array.isArray(seats) || seats.length === 0) {
        throw new AppError("Seats array is required", 400, "INVALID_SEAT_SELECTION");
    }

    const normalizedSeats = seats.map(normalizeSeatLabel);

    if (
        normalizedSeats.some((seat) => !seat || seat.length > 20)
        || seats.some((seat) => typeof seat !== "string")
    ) {
        throw new AppError("Seats array is required", 400, "INVALID_SEAT_SELECTION");
    }

    if (new Set(normalizedSeats).size !== normalizedSeats.length) {
        throw new AppError("Duplicate seats are not allowed", 400, "DUPLICATE_SEAT_SELECTION");
    }

    return normalizedSeats;
};

const getNormalizedBookedSeats = (show) => (
    Array.isArray(show?.bookedSeats)
        ? show.bookedSeats.map(normalizeSeatLabel).filter(Boolean)
        : []
);

const getShowSeatCapacity = (show) => Number(show?.screen?.capacity ?? show?.totalSeats ?? 0);

const resolveBookingSeatValidationMode = async (show, options = {}) => {
    if (!show?.screen) {
        return {
            mode: BOOKING_SEAT_VALIDATION_MODE.LEGACY,
            capacity: Number(show?.totalSeats || 0),
        };
    }

    const capacity = getShowSeatCapacity(show);
    const showSeatCount = await showSeatRepository.countByShow(show._id, options);

    if (showSeatCount !== capacity) {
        throw new AppError(
            "ShowSeat inventory is not ready for this show",
            409,
            "SHOWSEAT_INVENTORY_NOT_READY"
        );
    }

    return {
        mode: BOOKING_SEAT_VALIDATION_MODE.INITIALIZED,
        capacity,
    };
};

const validateBookingSeatSelection = async (show, seats, options = {}) => {
    const normalizedSeats = normalizeSeatSelection(seats);
    const bookedSeatLabels = getNormalizedBookedSeats(show);
    const bookedSeatSet = new Set(bookedSeatLabels);
    const legacyUnavailableSeats = normalizedSeats.filter((seat) => bookedSeatSet.has(seat));
    const validationMode = await resolveBookingSeatValidationMode(show, options);

    if (validationMode.mode === BOOKING_SEAT_VALIDATION_MODE.LEGACY) {
        if (legacyUnavailableSeats.length > 0) {
            throw createSeatConflictError({
                unavailableSeats: legacyUnavailableSeats,
                availableSeats: normalizedSeats.filter((seat) => !bookedSeatSet.has(seat)),
                allBookedSeats: bookedSeatLabels,
                message: `Seats ${legacyUnavailableSeats.join(", ")} are no longer available`,
            });
        }

        return {
            mode: validationMode.mode,
            seats: normalizedSeats,
            availableSeats: normalizedSeats,
            unavailableSeats: [],
            allBookedSeats: bookedSeatLabels,
        };
    }

    const showSeats = await showSeatRepository.findByShowAndSeatNumbers(show._id, normalizedSeats, options);
    const showSeatsByLabel = indexSeatsByLabel(showSeats);
    const missingSeats = normalizedSeats.filter((seat) => !showSeatsByLabel.has(seat));

    if (missingSeats.length > 0 || showSeats.length !== normalizedSeats.length) {
        throw createSeatConflictError({
            unavailableSeats: missingSeats,
            availableSeats: normalizedSeats.filter((seat) => !missingSeats.includes(seat)),
            allBookedSeats: bookedSeatLabels,
            message: "Selected seats are not available for this show",
            code: "SHOWSEAT_SEAT_NOT_FOUND",
        });
    }

    const showSeatUnavailableSeats = normalizedSeats.filter((seat) => (
        showSeatsByLabel.get(seat)?.status !== SHOW_SEAT_STATUS.AVAILABLE
    ));
    const unavailableSeats = [...new Set([...legacyUnavailableSeats, ...showSeatUnavailableSeats])];

    if (unavailableSeats.length > 0) {
        throw createSeatConflictError({
            unavailableSeats,
            availableSeats: normalizedSeats.filter((seat) => !unavailableSeats.includes(seat)),
            allBookedSeats: bookedSeatLabels,
        });
    }

    return {
        mode: validationMode.mode,
        seats: normalizedSeats,
        showSeats,
        availableSeats: normalizedSeats,
        unavailableSeats: [],
        allBookedSeats: bookedSeatLabels,
    };
};

const markSeatsBookedForBooking = async ({ showId, seatNumbers, bookingId, bookedAt }, options = {}) => {
    const result = await showSeatRepository.markSeatsBooked({
        showId,
        seatNumbers,
        bookingId,
        bookedAt,
    }, options);

    const modifiedCount = result.modifiedCount ?? result.nModified ?? 0;

    if (modifiedCount !== seatNumbers.length) {
        throw createSeatConflictError({
            unavailableSeats: seatNumbers,
            availableSeats: [],
            allBookedSeats: [],
        });
    }

    return result;
};

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

const getShowSeatAvailability = async (showId) => {
    ensureValidObjectId(showId);

    const show = await Show.findById(showId)
        .select("_id screen totalSeats")
        .populate("screen", "name screenNumber capacity theatre isActive");

    if (!show) {
        throw new AppError("Show not found", 404, "SHOW_NOT_FOUND");
    }

    if (!show.screen) {
        return {
            showId: asIdString(show),
            screenId: null,
            screenName: null,
            screenNumber: null,
            capacity: show.totalSeats || 0,
            layoutStatus: SHOW_SEAT_LAYOUT_STATUS.LEGACY,
            seats: [],
        };
    }

    const capacity = Number(show.screen.capacity ?? show.totalSeats ?? 0);
    const showSeats = await showSeatRepository.findAvailabilityByShow(show._id);

    if (showSeats.length !== capacity) {
        throw new AppError(
            "ShowSeat inventory is not ready for this show",
            409,
            "SHOWSEAT_INVENTORY_NOT_READY"
        );
    }

    return {
        showId: asIdString(show),
        screenId: asIdString(show.screen),
        screenName: getScreenLabel(show.screen),
        screenNumber: show.screen.screenNumber ?? null,
        capacity,
        layoutStatus: SHOW_SEAT_LAYOUT_STATUS.INITIALIZED,
        seats: sortSeats(showSeats).map(sanitizeShowSeatForAvailability),
    };
};

module.exports = {
    BOOKING_SEAT_VALIDATION_MODE,
    SHOW_SEAT_AUDIT_CLASSIFICATION,
    SHOW_SEAT_LAYOUT_STATUS,
    auditShowSeatInitialization,
    buildShowSeatPayloads,
    getShowSeatAvailability,
    initializeShowSeats,
    markSeatsBookedForBooking,
    normalizeSeatLabel,
    normalizeSeatSelection,
    validateBookingSeatSelection,
};
