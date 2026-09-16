const mongoose = require("mongoose");
const Seat = require("./seatSchema");

const { SEAT_TYPES } = Seat;

const SHOW_SEAT_STATUS = Object.freeze({
    AVAILABLE: "AVAILABLE",
    LOCKED: "LOCKED",
    BOOKED: "BOOKED",
});

const positiveIntegerValidator = {
    validator(value) {
        return Number.isInteger(value) && value > 0;
    },
    message: "{PATH} must be a positive integer",
};

const trimUppercase = (value) => (
    typeof value === "string" ? value.trim().toUpperCase() : value
);

const requiredWhenLocked = function requiredWhenLocked(value) {
    if (this.status !== SHOW_SEAT_STATUS.LOCKED) {
        return true;
    }

    return value !== null && value !== undefined && value !== "";
};

const showSeatSchema = new mongoose.Schema(
    {
        show: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "shows",
            required: true,
        },
        seat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seat",
            required: true,
        },
        seatNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            set: trimUppercase,
        },
        row: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            set: trimUppercase,
        },
        column: {
            type: Number,
            required: true,
            validate: positiveIntegerValidator,
        },
        seatType: {
            type: String,
            enum: Object.values(SEAT_TYPES),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(SHOW_SEAT_STATUS),
            required: true,
            default: SHOW_SEAT_STATUS.AVAILABLE,
        },
        bookedAt: {
            type: Date,
            default: null,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "bookings",
            default: null,
        },
        lockOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            default: null,
            validate: {
                validator: requiredWhenLocked,
                message: "lockOwner is required when ShowSeat is LOCKED",
            },
        },
        lockToken: {
            type: String,
            trim: true,
            default: null,
            validate: {
                validator: requiredWhenLocked,
                message: "lockToken is required when ShowSeat is LOCKED",
            },
        },
        lockedAt: {
            type: Date,
            default: null,
            validate: {
                validator: requiredWhenLocked,
                message: "lockedAt is required when ShowSeat is LOCKED",
            },
        },
        lockExpiresAt: {
            type: Date,
            default: null,
            validate: {
                validator: requiredWhenLocked,
                message: "lockExpiresAt is required when ShowSeat is LOCKED",
            },
        },
    },
    { timestamps: true }
);

showSeatSchema.index({ show: 1, seat: 1 }, { unique: true });
showSeatSchema.index({ show: 1, status: 1 });
showSeatSchema.index({ show: 1, seatNumber: 1 });
showSeatSchema.index({ show: 1, seatNumber: 1, status: 1 });
showSeatSchema.index({ show: 1, lockOwner: 1, lockToken: 1 });
showSeatSchema.index({ status: 1, lockExpiresAt: 1 });

const ShowSeat = mongoose.model("ShowSeat", showSeatSchema);
module.exports = ShowSeat;
module.exports.SHOW_SEAT_STATUS = SHOW_SEAT_STATUS;
