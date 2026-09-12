const mongoose = require("mongoose");
const Seat = require("./seatSchema");

const { SEAT_TYPES } = Seat;

const positivePriceValidator = {
    validator(value) {
        return value === undefined || (Number.isFinite(value) && value >= 0);
    },
    message: "{PATH} must be a non-negative number",
};

const bookingSchema = new mongoose.Schema(
    {
        show: {
            type: mongoose.Schema.Types.ObjectId,
            ref : "shows",
            required : true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref : "users",
            required : true
        },
        seats: {
            type: [String],
            required: true,
        },
        seatType: {
            type: String,
            default: "Standard",
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        receipt: {
            type: String,
            required: true
        },
        bookingId: {
            type: String,
            required: true,
            unique: true, // enforce unique booking references
            index: true,
        },
        amount: {
            type: Number,
            required: true
        },
        ticketAmount: {
            type: Number,
            validate: positivePriceValidator,
        },
        seatPricing: {
            type: [
                {
                    seatNumber: {
                        type: String,
                        required: true,
                        trim: true,
                        uppercase: true,
                    },
                    seatType: {
                        type: String,
                        enum: Object.values(SEAT_TYPES),
                        required: true,
                    },
                    price: {
                        type: Number,
                        required: true,
                        validate: positivePriceValidator,
                    },
                    _id: false,
                },
            ],
            default: [],
        },
        convenienceFee: {
            type: Number,
            default: 0,
        },
        gstPercent: {
            type: Number,
            default: 18,
        },
        paymentMethod: {
            type: String,
            default: "N/A",
        },
        ticketStatus: {
            type: String,
            enum: ["Confirmed", "Cancelled", "Pending"],
            default: "Confirmed",
        }
    },
    { timestamps: true }
);

// paymentStatus

const Booking= mongoose.model("bookings", bookingSchema);
module.exports = Booking;
