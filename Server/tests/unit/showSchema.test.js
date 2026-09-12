const mongoose = require("mongoose");
const Show = require("../../models/showSchema");

describe("showSchema ticketPricing", () => {
    const buildShow = (overrides = {}) => new Show({
        name: "Evening Show",
        date: "2026-09-03",
        time: "18:00",
        movie: new mongoose.Types.ObjectId(),
        ticketPrice: 200,
        totalSeats: 250,
        theatre: new mongoose.Types.ObjectId(),
        ...overrides,
    });

    test("legacy Show with ticketPrice only remains valid", async () => {
        const show = buildShow();

        await expect(show.validate()).resolves.toBeUndefined();
        expect(show.ticketPrice).toBe(200);
        expect(show.ticketPricing).toEqual({});
    });

    test("Show with complete ticketPricing is valid", async () => {
        const show = buildShow({
            ticketPricing: {
                STANDARD: 150,
                PREMIUM: 220,
                RECLINER: 320,
            },
        });

        await expect(show.validate()).resolves.toBeUndefined();
        expect(show.ticketPricing.STANDARD).toBe(150);
        expect(show.ticketPricing.PREMIUM).toBe(220);
        expect(show.ticketPricing.RECLINER).toBe(320);
    });

    test("partial ticketPricing is valid", async () => {
        const show = buildShow({
            ticketPricing: {
                STANDARD: 150,
                PREMIUM: 220,
            },
        });

        await expect(show.validate()).resolves.toBeUndefined();
        expect(show.ticketPricing.STANDARD).toBe(150);
        expect(show.ticketPricing.PREMIUM).toBe(220);
        expect(show.ticketPricing.RECLINER).toBeUndefined();
    });

    test("zero pricing is rejected", async () => {
        const show = buildShow({
            ticketPricing: {
                STANDARD: 0,
            },
        });

        await expect(show.validate()).rejects.toThrow(/positive number/);
    });

    test("negative pricing is rejected", async () => {
        const show = buildShow({
            ticketPricing: {
                PREMIUM: -1,
            },
        });

        await expect(show.validate()).rejects.toThrow(/positive number/);
    });

    test("invalid numeric pricing is rejected", async () => {
        const show = buildShow({
            ticketPricing: {
                RECLINER: Number.NaN,
            },
        });

        await expect(show.validate()).rejects.toThrow();
    });
});
