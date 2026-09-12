const mongoose = require("mongoose");
const Seat = require("./seatSchema");

const { SEAT_TYPES } = Seat;

const positivePriceValidator = {
    validator(value) {
        return value === undefined || (Number.isFinite(value) && value > 0);
    },
    message: "{PATH} must be a positive number",
};

const showSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        time: {
            type: String,
            required: true
        },
        movie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "movies",
            required: true
        },
        ticketPrice: {
            type: Number,
            required: true
        },
        ticketPricing: {
            STANDARD: {
                type: Number,
                validate: positivePriceValidator,
            },
            PREMIUM: {
                type: Number,
                validate: positivePriceValidator,
            },
            RECLINER: {
                type: Number,
                validate: positivePriceValidator,
            },
        },
        totalSeats: {
            type: Number,
            required: true
        },
        bookedSeats: {
            type: [String],
            default : []
        },
        theatre: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "theatres",
            required: true
        },
        screen: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Screen",
            required: false
        }
    },
    { timestamps: true }
);

const Show = mongoose.model("shows", showSchema);
module.exports = Show;
module.exports.SHOW_TICKET_PRICING_TYPES = SEAT_TYPES;
