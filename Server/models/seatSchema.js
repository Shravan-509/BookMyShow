const mongoose = require("mongoose");

const SEAT_TYPES = Object.freeze({
    STANDARD: "STANDARD",
    PREMIUM: "PREMIUM",
    RECLINER: "RECLINER",
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

const seatSchema = new mongoose.Schema(
    {
        screen: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Screen",
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
            default: SEAT_TYPES.STANDARD,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

seatSchema.index({ screen: 1, seatNumber: 1 }, { unique: true });
seatSchema.index({ screen: 1, row: 1, column: 1 }, { unique: true });

const Seat = mongoose.model("Seat", seatSchema);
module.exports = Seat;
module.exports.SEAT_TYPES = SEAT_TYPES;
