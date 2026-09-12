const showPricingService = require("../../services/showPricingService");

describe("showPricingService", () => {
    const show = {
        ticketPrice: 175,
        ticketPricing: {
            STANDARD: 150,
            PREMIUM: 220,
            RECLINER: 320,
        },
    };

    test("STANDARD explicit price resolves", () => {
        expect(showPricingService.resolveSeatTypePrice(show, "STANDARD")).toBe(150);
    });

    test("PREMIUM explicit price resolves", () => {
        expect(showPricingService.resolveSeatTypePrice(show, "PREMIUM")).toBe(220);
    });

    test("RECLINER explicit price resolves", () => {
        expect(showPricingService.resolveSeatTypePrice(show, "RECLINER")).toBe(320);
    });

    test("missing category falls back to ticketPrice", () => {
        expect(showPricingService.resolveSeatTypePrice({
            ticketPrice: 175,
            ticketPricing: {
                STANDARD: 150,
            },
        }, "PREMIUM")).toBe(175);
    });

    test("completely missing ticketPricing falls back to ticketPrice", () => {
        expect(showPricingService.resolveSeatTypePrice({ ticketPrice: 175 }, "RECLINER")).toBe(175);
    });

    test("mixed-seat subtotal is calculated with a breakdown", () => {
        const result = showPricingService.buildSeatPricing(show, [
            { seatNumber: "A1", seatType: "STANDARD" },
            { seatNumber: "J5", seatType: "PREMIUM" },
            { seatNumber: "R2", seatType: "RECLINER" },
        ]);

        expect(result).toEqual({
            ticketAmount: 690,
            seatPricing: [
                { seatNumber: "A1", seatType: "STANDARD", price: 150 },
                { seatNumber: "J5", seatType: "PREMIUM", price: 220 },
                { seatNumber: "R2", seatType: "RECLINER", price: 320 },
            ],
        });
    });

    test("decimal mixed-seat subtotal is rounded to two currency decimals", () => {
        const result = showPricingService.buildSeatPricing({
            ticketPrice: 100.1,
            ticketPricing: {
                STANDARD: 100.15,
                PREMIUM: 200.2,
            },
        }, [
            { seatNumber: "A1", seatType: "STANDARD" },
            { seatNumber: "J5", seatType: "PREMIUM" },
        ]);

        expect(result.ticketAmount).toBe(300.35);
    });

    test("empty seat list returns a zero subtotal and empty breakdown", () => {
        expect(showPricingService.buildSeatPricing(show, [])).toEqual({
            ticketAmount: 0,
            seatPricing: [],
        });
    });

    test("unsupported seatType is rejected", () => {
        expect(() => showPricingService.resolveSeatTypePrice(show, "VIP")).toThrow(/Unsupported seat type/);
    });

    test("invalid ticketPricing values are rejected during normalization", () => {
        expect(() => showPricingService.validateTicketPricing({ STANDARD: 0 })).toThrow(/positive number/);
        expect(() => showPricingService.validateTicketPricing({ PREMIUM: -10 })).toThrow(/positive number/);
        expect(() => showPricingService.validateTicketPricing({ RECLINER: "320" })).toThrow(/positive number/);
    });

    test("ticketPricing normalization preserves supplied canonical prices", () => {
        expect(showPricingService.validateTicketPricing({
            standard: 150,
            PREMIUM: 220,
        })).toEqual({
            STANDARD: 150,
            PREMIUM: 220,
        });
    });
});
