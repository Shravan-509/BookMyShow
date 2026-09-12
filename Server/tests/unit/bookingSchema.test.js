const mongoose = require("mongoose");
const Booking = require("../../models/bookingSchema");

describe("bookingSchema pricing snapshots", () => {
    const buildBooking = (overrides = {}) => new Booking({
        show: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ["A1", "J5"],
        transactionId: "pay_1",
        orderId: "order_1",
        receipt: "receipt_1",
        bookingId: "BMS1234",
        amount: 417.2,
        ...overrides,
    });

    test("legacy booking without price snapshots remains valid", async () => {
        const booking = buildBooking();

        await expect(booking.validate()).resolves.toBeUndefined();
        expect(booking.seats).toEqual(["A1", "J5"]);
        expect(booking.seatPricing).toEqual([]);
    });

    test("ticketAmount and per-seat pricing snapshots are valid", async () => {
        const booking = buildBooking({
            ticketAmount: 370,
            seatPricing: [
                { seatNumber: "A1", seatType: "STANDARD", price: 150 },
                { seatNumber: "J5", seatType: "PREMIUM", price: 220 },
            ],
        });

        await expect(booking.validate()).resolves.toBeUndefined();
        expect(booking.ticketAmount).toBe(370);
        expect(booking.toObject().seatPricing).toEqual([
            { seatNumber: "A1", seatType: "STANDARD", price: 150 },
            { seatNumber: "J5", seatType: "PREMIUM", price: 220 },
        ]);
    });

    test("seatPricing rejects unsupported seat types", async () => {
        const booking = buildBooking({
            seatPricing: [
                { seatNumber: "A1", seatType: "VIP", price: 150 },
            ],
        });

        await expect(booking.validate()).rejects.toThrow(/`VIP` is not a valid enum value/);
    });

    test("ticketAmount and seat price reject negative values", async () => {
        await expect(buildBooking({ ticketAmount: -1 }).validate()).rejects.toThrow(/non-negative number/);
        await expect(buildBooking({
            seatPricing: [
                { seatNumber: "A1", seatType: "STANDARD", price: -1 },
            ],
        }).validate()).rejects.toThrow(/non-negative number/);
    });
});
