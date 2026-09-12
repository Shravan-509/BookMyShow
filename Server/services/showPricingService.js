const Seat = require("../models/seatSchema");
const AppError = require("../utils/AppError");

const { SEAT_TYPES } = Seat;
const SUPPORTED_SEAT_TYPES = Object.freeze(Object.values(SEAT_TYPES));

const isPositiveFiniteNumber = (value) => (
    typeof value === "number" && Number.isFinite(value) && value > 0
);

const normalizeSeatType = (seatType) => (
    typeof seatType === "string" ? seatType.trim().toUpperCase() : ""
);

const assertSupportedSeatType = (seatType) => {
    const normalizedSeatType = normalizeSeatType(seatType);

    if (!SUPPORTED_SEAT_TYPES.includes(normalizedSeatType)) {
        throw new AppError(`Unsupported seat type: ${seatType}`, 400, "UNSUPPORTED_SEAT_TYPE");
    }

    return normalizedSeatType;
};

const validateTicketPricing = (ticketPricing) => {
    if (ticketPricing === undefined || ticketPricing === null) {
        return undefined;
    }

    if (
        typeof ticketPricing !== "object"
        || Array.isArray(ticketPricing)
    ) {
        throw new AppError("ticketPricing must be an object", 400, "INVALID_TICKET_PRICING");
    }

    const sanitizedPricing = {};

    Object.entries(ticketPricing).forEach(([seatType, price]) => {
        const normalizedSeatType = assertSupportedSeatType(seatType);

        if (!isPositiveFiniteNumber(price)) {
            throw new AppError(
                `ticketPricing.${normalizedSeatType} must be a positive number`,
                400,
                "INVALID_TICKET_PRICING"
            );
        }

        sanitizedPricing[normalizedSeatType] = price;
    });

    return Object.keys(sanitizedPricing).length > 0
        ? sanitizedPricing
        : undefined;
};

const resolveSeatTypePrice = (show, seatType) => {
    const normalizedSeatType = assertSupportedSeatType(seatType);
    const explicitPrice = show?.ticketPricing?.[normalizedSeatType];

    if (isPositiveFiniteNumber(explicitPrice)) {
        return explicitPrice;
    }

    const fallbackPrice = show?.ticketPrice;
    if (!isPositiveFiniteNumber(fallbackPrice)) {
        throw new AppError("Show ticket price is invalid", 500, "INVALID_SHOW_TICKET_PRICE");
    }

    return fallbackPrice;
};

const buildSeatPricing = (show, showSeats = []) => {
    if (!Array.isArray(showSeats)) {
        throw new AppError("showSeats must be an array", 400, "INVALID_SHOW_SEATS");
    }

    const seatPricing = showSeats.map((showSeat) => {
        const seatType = assertSupportedSeatType(showSeat?.seatType);
        const price = resolveSeatTypePrice(show, seatType);

        return {
            seatNumber: showSeat?.seatNumber,
            seatType,
            price,
        };
    });

    const ticketAmount = Number(
        seatPricing.reduce((sum, seat) => sum + seat.price, 0).toFixed(2)
    );

    return {
        ticketAmount,
        seatPricing,
    };
};

const calculateTicketSubtotal = (show, showSeats = []) => (
    buildSeatPricing(show, showSeats).ticketAmount
);

module.exports = {
    SUPPORTED_SEAT_TYPES,
    assertSupportedSeatType,
    buildSeatPricing,
    calculateTicketSubtotal,
    resolveSeatTypePrice,
    validateTicketPricing,
};
