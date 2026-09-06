const mongoose = require("mongoose");
const seatRepository = require("../repositories/seatRepository");
const Screen = require("../models/screenSchema");
const Theatre = require("../models/theatreSchema");
const AppError = require("../utils/AppError");
const { SEAT_TYPES } = require("../models/seatSchema");

const LAYOUT_STATUS = Object.freeze({
    INCOMPLETE: "INCOMPLETE",
    COMPLETE: "COMPLETE",
});

const ensureValidObjectId = (id, code = "INVALID_ID") => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid resource identifier", 400, code);
    }
};

const normalizeText = (value) => (
    typeof value === "string" ? value.trim().toUpperCase() : value
);

const normalizePositiveInteger = (value, fieldName, code = "SEAT_VALIDATION_ERROR") => {
    const numberValue = Number(value);
    if (!Number.isInteger(numberValue) || numberValue <= 0) {
        throw new AppError(`${fieldName} must be a positive integer`, 400, code);
    }
    return numberValue;
};

const validateRow = (row) => {
    if (!row || typeof row !== "string" || !/^[A-Z]+$/.test(row)) {
        throw new AppError("Row must contain letters only", 400, "SEAT_VALIDATION_ERROR");
    }
};

const validateSeatType = (seatType) => {
    if (!Object.values(SEAT_TYPES).includes(seatType)) {
        throw new AppError("Invalid seat type", 400, "INVALID_SEAT_TYPE");
    }
};

const ensureSeatNumberMatchesPosition = ({ seatNumber, row, column }) => {
    if (seatNumber !== `${row}${column}`) {
        throw new AppError("Seat number must match row and column", 400, "SEAT_POSITION_MISMATCH");
    }
};

const sanitizeSeatPayload = (payload = {}, existingSeat = {}) => {
    const row = payload.row !== undefined
        ? normalizeText(payload.row)
        : existingSeat.row;
    const column = payload.column !== undefined
        ? normalizePositiveInteger(payload.column, "Column")
        : existingSeat.column;
    const seatNumber = payload.seatNumber !== undefined
        ? normalizeText(payload.seatNumber)
        : existingSeat.seatNumber;

    return {
        screen: payload.screen ?? existingSeat.screen,
        seatNumber,
        row,
        column,
        seatType: payload.seatType !== undefined
            ? normalizeText(payload.seatType)
            : existingSeat.seatType ?? SEAT_TYPES.STANDARD,
        isActive: payload.isActive ?? existingSeat.isActive ?? true,
    };
};

const validateRequiredSeatFields = (seatPayload) => {
    if (!seatPayload.screen) {
        throw new AppError("Screen is required", 400, "SEAT_VALIDATION_ERROR");
    }
    if (!seatPayload.seatNumber) {
        throw new AppError("Seat number is required", 400, "SEAT_VALIDATION_ERROR");
    }
    validateRow(seatPayload.row);
    if (!seatPayload.column) {
        throw new AppError("Column is required", 400, "SEAT_VALIDATION_ERROR");
    }
    validateSeatType(seatPayload.seatType);
    ensureSeatNumberMatchesPosition(seatPayload);
};

const getScreenOrThrow = async (screenId, { requireActive = false } = {}) => {
    ensureValidObjectId(screenId, "INVALID_SCREEN_ID");

    const screen = await Screen.findById(screenId).select("theatre capacity isActive name screenNumber");
    if (!screen) {
        throw new AppError("Screen not found", 404, "SCREEN_NOT_FOUND");
    }
    if (requireActive && !screen.isActive) {
        throw new AppError("Seats can only be configured for active screens", 400, "INACTIVE_SCREEN");
    }
    return screen;
};

const ensureScreenManageAccess = async (req, screenId, { requireActive = false } = {}) => {
    const screen = await getScreenOrThrow(screenId, { requireActive });
    const theatre = await Theatre.findById(screen.theatre).select("owner isActive name");

    if (!theatre) {
        throw new AppError("Theatre not found", 404, "THEATRE_NOT_FOUND");
    }

    if (!["admin", "partner"].includes(req.user?.role)) {
        throw new AppError("Access denied", 403, "SEAT_ACCESS_DENIED");
    }

    if (req.user?.role === "partner" && theatre.owner?.toString() !== req.userId.toString()) {
        throw new AppError("Access denied", 403, "SEAT_ACCESS_DENIED");
    }

    return { screen, theatre };
};

const ensureSeatManageAccess = async (req, seat) => {
    const screenId = seat.screen?._id || seat.screen;
    return ensureScreenManageAccess(req, screenId);
};

const getLayoutStatus = (activeSeatCount, capacity) => (
    activeSeatCount === capacity ? LAYOUT_STATUS.COMPLETE : LAYOUT_STATUS.INCOMPLETE
);

const attachLayoutSummary = async (screen, seats) => {
    const activeSeatCount = seats.filter((seat) => seat.isActive).length;
    return {
        seats,
        summary: {
            capacity: screen.capacity,
            activeSeatCount,
            remainingCapacity: Math.max(screen.capacity - activeSeatCount, 0),
            layoutStatus: getLayoutStatus(activeSeatCount, screen.capacity),
        },
    };
};

const assertCapacityAvailable = async (screen, additionalActiveSeats) => {
    if (additionalActiveSeats <= 0) {
        return;
    }

    const activeSeatCount = await seatRepository.countActiveByScreen(screen._id);
    if (activeSeatCount + additionalActiveSeats > screen.capacity) {
        throw new AppError("Active seats cannot exceed screen capacity", 400, "SCREEN_CAPACITY_EXCEEDED");
    }
};

const assertNoDuplicates = async ({ screen, seatNumber, row, column, excludeId }) => {
    const duplicateSeatNumber = await seatRepository.findDuplicateSeatNumber({
        screen,
        seatNumber,
        excludeId,
    });
    if (duplicateSeatNumber) {
        throw new AppError("Seat number already exists for this screen", 409, "DUPLICATE_SEAT_NUMBER");
    }

    const duplicatePosition = await seatRepository.findDuplicatePosition({
        screen,
        row,
        column,
        excludeId,
    });
    if (duplicatePosition) {
        throw new AppError("Seat position already exists for this screen", 409, "DUPLICATE_SEAT_POSITION");
    }
};

const handleDuplicateSeat = (error) => {
    if (error?.code === 11000) {
        throw new AppError("Seat already exists for this screen", 409, "DUPLICATE_SEAT");
    }
    throw error;
};

const getSeatById = async (req, id) => {
    ensureValidObjectId(id, "INVALID_SEAT_ID");

    const seat = await seatRepository.findById(id);
    if (!seat) {
        throw new AppError("Seat not found", 404, "SEAT_NOT_FOUND");
    }

    await ensureSeatManageAccess(req, seat);
    return seat;
};

const getSeatsByScreen = async (req, screenId) => {
    const { screen } = await ensureScreenManageAccess(req, screenId);
    const seats = await seatRepository.findByScreen(screenId);
    return attachLayoutSummary(screen, seats);
};

const createSeat = async (req, payload) => {
    const seatPayload = sanitizeSeatPayload(payload);
    validateRequiredSeatFields(seatPayload);

    const { screen } = await ensureScreenManageAccess(req, seatPayload.screen, { requireActive: true });
    await assertNoDuplicates(seatPayload);
    await assertCapacityAvailable(screen, seatPayload.isActive ? 1 : 0);

    try {
        return await seatRepository.createSeat(seatPayload);
    } catch (error) {
        handleDuplicateSeat(error);
    }
};

const updateSeat = async (req, id, payload) => {
    ensureValidObjectId(id, "INVALID_SEAT_ID");

    const existingSeat = await seatRepository.findById(id);
    if (!existingSeat) {
        throw new AppError("Seat not found", 404, "SEAT_NOT_FOUND");
    }

    await ensureSeatManageAccess(req, existingSeat);

    if (payload.screen && payload.screen.toString() !== existingSeat.screen._id.toString()) {
        throw new AppError("Seat screen cannot be changed", 400, "SEAT_SCREEN_IMMUTABLE");
    }

    const seatPayload = sanitizeSeatPayload(payload, {
        ...existingSeat.toObject?.() || existingSeat,
        screen: existingSeat.screen._id,
    });
    validateRequiredSeatFields(seatPayload);
    await assertNoDuplicates({ ...seatPayload, excludeId: id });

    if (!existingSeat.isActive && seatPayload.isActive) {
        await assertCapacityAvailable(existingSeat.screen, 1);
    }

    try {
        return await seatRepository.updateSeat(id, seatPayload);
    } catch (error) {
        handleDuplicateSeat(error);
    }
};

const disableSeat = async (req, id) => {
    ensureValidObjectId(id, "INVALID_SEAT_ID");

    const existingSeat = await seatRepository.findById(id);
    if (!existingSeat) {
        throw new AppError("Seat not found", 404, "SEAT_NOT_FOUND");
    }

    await ensureSeatManageAccess(req, existingSeat);
    return seatRepository.updateSeat(id, { isActive: false });
};

const normalizeBulkRow = (rowDefinition) => {
    const row = normalizeText(rowDefinition.row);
    validateRow(row);

    const startColumn = normalizePositiveInteger(rowDefinition.startColumn, "Start column");
    const endColumn = normalizePositiveInteger(rowDefinition.endColumn, "End column");
    if (startColumn > endColumn) {
        throw new AppError("Start column must be less than or equal to end column", 400, "INVALID_SEAT_RANGE");
    }

    const seatType = normalizeText(rowDefinition.seatType || SEAT_TYPES.STANDARD);
    validateSeatType(seatType);

    const excludedColumns = rowDefinition.excludedColumns || [];
    if (!Array.isArray(excludedColumns)) {
        throw new AppError("Excluded columns must be an array", 400, "INVALID_EXCLUDED_COLUMNS");
    }

    const normalizedExcluded = excludedColumns.map((column) => normalizePositiveInteger(column, "Excluded column", "INVALID_EXCLUDED_COLUMNS"));
    normalizedExcluded.forEach((column) => {
        if (column < startColumn || column > endColumn) {
            throw new AppError("Excluded columns must be inside the selected range", 400, "INVALID_EXCLUDED_COLUMNS");
        }
    });

    return {
        row,
        startColumn,
        endColumn,
        seatType,
        excludedColumns: new Set(normalizedExcluded),
    };
};

const buildBulkSeats = (screenId, rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
        throw new AppError("Rows array is required", 400, "SEAT_VALIDATION_ERROR");
    }

    const generatedSeats = [];
    const requestSeatNumbers = new Set();
    const requestPositions = new Set();

    rows.forEach((rowDefinition) => {
        const normalizedRow = normalizeBulkRow(rowDefinition);

        for (let column = normalizedRow.startColumn; column <= normalizedRow.endColumn; column += 1) {
            if (normalizedRow.excludedColumns.has(column)) {
                continue;
            }

            const seatNumber = `${normalizedRow.row}${column}`;
            const positionKey = `${normalizedRow.row}:${column}`;

            if (requestSeatNumbers.has(seatNumber)) {
                throw new AppError("Duplicate generated seat number in request", 400, "DUPLICATE_SEAT_IN_REQUEST");
            }
            if (requestPositions.has(positionKey)) {
                throw new AppError("Duplicate generated seat position in request", 400, "DUPLICATE_SEAT_IN_REQUEST");
            }

            requestSeatNumbers.add(seatNumber);
            requestPositions.add(positionKey);
            generatedSeats.push({
                screen: screenId,
                seatNumber,
                row: normalizedRow.row,
                column,
                seatType: normalizedRow.seatType,
                isActive: true,
            });
        }
    });

    return generatedSeats;
};

const assertNoBulkDuplicatesAgainstExisting = async (screenId, generatedSeats) => {
    const existingSeats = await seatRepository.findByScreen(screenId);
    const existingSeatNumbers = new Set(existingSeats.map((seat) => seat.seatNumber));
    const existingPositions = new Set(existingSeats.map((seat) => `${seat.row}:${seat.column}`));

    generatedSeats.forEach((seat) => {
        if (existingSeatNumbers.has(seat.seatNumber)) {
            throw new AppError("Generated seat number already exists for this screen", 409, "DUPLICATE_SEAT_NUMBER");
        }
        if (existingPositions.has(`${seat.row}:${seat.column}`)) {
            throw new AppError("Generated seat position already exists for this screen", 409, "DUPLICATE_SEAT_POSITION");
        }
    });
};

const bulkCreateSeats = async (req, screenId, rows) => {
    const { screen } = await ensureScreenManageAccess(req, screenId, { requireActive: true });
    const generatedSeats = buildBulkSeats(screenId, rows);

    await assertNoBulkDuplicatesAgainstExisting(screenId, generatedSeats);
    await assertCapacityAvailable(screen, generatedSeats.length);

    try {
        return await seatRepository.insertSeats(generatedSeats);
    } catch (error) {
        handleDuplicateSeat(error);
    }
};

module.exports = {
    SEAT_TYPES,
    LAYOUT_STATUS,
    ensureScreenManageAccess,
    getSeatById,
    getSeatsByScreen,
    createSeat,
    updateSeat,
    disableSeat,
    buildBulkSeats,
    bulkCreateSeats,
};
