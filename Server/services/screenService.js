const mongoose = require("mongoose");
const screenRepository = require("../repositories/screenRepository");
const seatRepository = require("../repositories/seatRepository");
const Theatre = require("../models/theatreSchema");
const Show = require("../models/showSchema");
const AppError = require("../utils/AppError");

const ensureValidObjectId = (id, code = "INVALID_ID") => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid resource identifier", 400, code);
    }
};

const normalizePositiveInteger = (value, fieldName) => {
    const numberValue = Number(value);
    if (!Number.isInteger(numberValue) || numberValue <= 0) {
        throw new AppError(`${fieldName} must be a positive integer`, 400, "SCREEN_VALIDATION_ERROR");
    }

    return numberValue;
};

const sanitizeScreenPayload = (payload = {}, existingScreen = {}) => ({
    theatre: payload.theatre ?? existingScreen.theatre,
    name: payload.name?.trim?.() ?? existingScreen.name,
    screenNumber: payload.screenNumber !== undefined
        ? normalizePositiveInteger(payload.screenNumber, "Screen number")
        : existingScreen.screenNumber,
    capacity: payload.capacity !== undefined
        ? normalizePositiveInteger(payload.capacity, "Capacity")
        : existingScreen.capacity,
    isActive: payload.isActive ?? existingScreen.isActive ?? true,
});

const withSession = (query, options = {}) => (
    options.session && typeof query.session === "function"
        ? query.session(options.session)
        : query
);

const ensureTheatreManageAccess = async (req, theatreId, { requireActive = false, session = null } = {}) => {
    ensureValidObjectId(theatreId, "INVALID_THEATRE_ID");

    const theatre = await withSession(Theatre.findById(theatreId).select("owner isActive name"), { session });
    if (!theatre) {
        throw new AppError("Theatre not found", 404, "THEATRE_NOT_FOUND");
    }

    if (requireActive && !theatre.isActive) {
        throw new AppError("Screens can only be configured for active theatres", 400, "INACTIVE_THEATRE");
    }

    if (req.user?.role === "partner" && theatre.owner?.toString() !== req.userId.toString()) {
        throw new AppError("Access denied", 403, "SCREEN_ACCESS_DENIED");
    }

    if (!["admin", "partner"].includes(req.user?.role)) {
        throw new AppError("Access denied", 403, "SCREEN_ACCESS_DENIED");
    }

    return theatre;
};

const handleDuplicateScreen = (error) => {
    if (error?.code === 11000) {
        throw new AppError("Screen number already exists for this theatre", 409, "DUPLICATE_SCREEN_NUMBER");
    }

    throw error;
};

const validateRequiredScreenFields = (screenPayload) => {
    if (!screenPayload.theatre) {
        throw new AppError("Theatre is required", 400, "SCREEN_VALIDATION_ERROR");
    }

    if (!screenPayload.name) {
        throw new AppError("Screen name is required", 400, "SCREEN_VALIDATION_ERROR");
    }

    if (!screenPayload.screenNumber) {
        throw new AppError("Screen number is required", 400, "SCREEN_VALIDATION_ERROR");
    }

    if (!screenPayload.capacity) {
        throw new AppError("Capacity is required", 400, "SCREEN_VALIDATION_ERROR");
    }
};

const ensureCapacitySupportsActiveSeats = async (screenId, requestedCapacity) => {
    const activeSeatCount = await seatRepository.countActiveByScreen(screenId);

    if (requestedCapacity < activeSeatCount) {
        throw new AppError(
            `Requested capacity ${requestedCapacity} cannot be lower than ${activeSeatCount} active seats.`,
            409,
            "SCREEN_CAPACITY_BELOW_ACTIVE_SEATS"
        );
    }
};

const getScreens = async (req) => {
    if (req.user?.role === "admin") {
        return screenRepository.findScreens();
    }

    if (req.user?.role === "partner") {
        const theatres = await Theatre.find({ owner: req.userId }).select("_id");
        return screenRepository.findByTheatres(theatres.map((theatre) => theatre._id));
    }

    throw new AppError("Access denied", 403, "SCREEN_ACCESS_DENIED");
};

const getScreenById = async (req, id) => {
    ensureValidObjectId(id, "INVALID_SCREEN_ID");

    const screen = await screenRepository.findById(id);
    if (!screen) {
        throw new AppError("Screen not found", 404, "SCREEN_NOT_FOUND");
    }

    await ensureTheatreManageAccess(req, screen.theatre);
    return screen;
};

const getScreensByTheatre = async (req, theatreId, options = {}) => {
    await ensureTheatreManageAccess(req, theatreId);
    return screenRepository.findByTheatre(theatreId, options);
};

const createScreen = async (req, payload) => {
    const screenPayload = sanitizeScreenPayload(payload);
    validateRequiredScreenFields(screenPayload);
    await ensureTheatreManageAccess(req, screenPayload.theatre, { requireActive: true });

    const duplicate = await screenRepository.findDuplicateScreenNumber({
        theatre: screenPayload.theatre,
        screenNumber: screenPayload.screenNumber,
    });

    if (duplicate) {
        throw new AppError("Screen number already exists for this theatre", 409, "DUPLICATE_SCREEN_NUMBER");
    }

    try {
        return await screenRepository.createScreen(screenPayload);
    } catch (error) {
        handleDuplicateScreen(error);
    }
};

const updateScreen = async (req, id, payload) => {
    ensureValidObjectId(id, "INVALID_SCREEN_ID");

    const existingScreen = await screenRepository.findById(id);
    if (!existingScreen) {
        throw new AppError("Screen not found", 404, "SCREEN_NOT_FOUND");
    }

    await ensureTheatreManageAccess(req, existingScreen.theatre);

    const screenPayload = sanitizeScreenPayload(payload, existingScreen);
    validateRequiredScreenFields(screenPayload);
    await ensureTheatreManageAccess(req, screenPayload.theatre, { requireActive: true });

    if (payload.capacity !== undefined && screenPayload.capacity !== existingScreen.capacity) {
        await ensureCapacitySupportsActiveSeats(id, screenPayload.capacity);
    }

    const duplicate = await screenRepository.findDuplicateScreenNumber({
        theatre: screenPayload.theatre,
        screenNumber: screenPayload.screenNumber,
        excludeId: id,
    });

    if (duplicate) {
        throw new AppError("Screen number already exists for this theatre", 409, "DUPLICATE_SCREEN_NUMBER");
    }

    try {
        return await screenRepository.updateScreen(id, screenPayload);
    } catch (error) {
        handleDuplicateScreen(error);
    }
};

const deleteScreen = async (req, id) => {
    ensureValidObjectId(id, "INVALID_SCREEN_ID");

    const screen = await screenRepository.findById(id);
    if (!screen) {
        throw new AppError("Screen not found", 404, "SCREEN_NOT_FOUND");
    }

    await ensureTheatreManageAccess(req, screen.theatre);

    const dependentShow = await Show.findOne({ screen: id }).select("_id");
    if (dependentShow) {
        return screenRepository.updateScreen(id, { isActive: false });
    }

    await screenRepository.deleteScreen(id);
    return { _id: id, deleted: true };
};

const ensureActiveScreenForTheatre = async (req, { screenId, theatreId }, options = {}) => {
    if (!screenId) {
        return null;
    }

    ensureValidObjectId(screenId, "INVALID_SCREEN_ID");
    ensureValidObjectId(theatreId, "INVALID_THEATRE_ID");

    const screen = await screenRepository.findActiveById(screenId, options);
    if (!screen) {
        throw new AppError("Screen must reference an active screen", 400, "INVALID_SCREEN_REFERENCE");
    }

    if (screen.theatre.toString() !== theatreId.toString()) {
        throw new AppError("Screen must belong to the selected theatre", 400, "SCREEN_THEATRE_MISMATCH");
    }

    await ensureTheatreManageAccess(req, theatreId, { session: options.session });
    return screen;
};

module.exports = {
    ensureTheatreManageAccess,
    getScreens,
    getScreenById,
    getScreensByTheatre,
    createScreen,
    updateScreen,
    deleteScreen,
    ensureActiveScreenForTheatre,
};
