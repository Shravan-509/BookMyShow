const mongoose = require("mongoose");

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
            required: true
        },
        orderId: {
            type: String,
            required: true
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