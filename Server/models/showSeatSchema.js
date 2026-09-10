const mongoose = require("mongoose");
const Seat = require("./seatSchema");

const { SEAT_TYPES } = Seat;

const SHOW_SEAT_STATUS = Object.freeze({
    AVAILABLE: "AVAILABLE",
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
    },
    { timestamps: true }
);

showSeatSchema.index({ show: 1, seat: 1 }, { unique: true });
showSeatSchema.index({ show: 1, status: 1 });
showSeatSchema.index({ show: 1, seatNumber: 1 });

const ShowSeat = mongoose.model("ShowSeat", showSeatSchema);
module.exports = ShowSeat;
module.exports.SHOW_SEAT_STATUS = SHOW_SEAT_STATUS;
