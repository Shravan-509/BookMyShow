import { describe, expect, test } from "vitest";
import {
  buildSelectedSeatPricing,
  getBookingPaidTotal,
  getBookingSeatPricing,
  getBookingTicketAmount,
  groupSeatPricing,
  resolveSeatTypePrice,
} from "./ticketPricing";

describe("ticketPricing utilities", () => {
  const show = {
    ticketPrice: 200,
    ticketPricing: {
      STANDARD: 180,
      PREMIUM: 260,
      RECLINER: 450,
    },
  };

  test("resolves seat-type prices with ticketPrice fallback", () => {
    expect(resolveSeatTypePrice(show, "premium")).toBe(260);
    expect(resolveSeatTypePrice({ ticketPrice: 200 }, "RECLINER")).toBe(200);
  });

  test("builds selected-seat subtotal from ShowSeat seat types", () => {
    const result = buildSelectedSeatPricing(
      show,
      [
        { seatNumber: "A1", seatType: "STANDARD" },
        { seatNumber: "B1", seatType: "PREMIUM" },
        { seatNumber: "C1", seatType: "RECLINER" },
      ],
      ["A1", "B1", "C1"],
    );

    expect(result.ticketAmount).toBe(890);
    expect(result.seatPricing).toEqual([
      expect.objectContaining({ seatNumber: "A1", seatType: "STANDARD", price: 180 }),
      expect.objectContaining({ seatNumber: "B1", seatType: "PREMIUM", price: 260 }),
      expect.objectContaining({ seatNumber: "C1", seatType: "RECLINER", price: 450 }),
    ]);
  });

  test("groups selected seats by type and price", () => {
    const groups = groupSeatPricing([
      { seatNumber: "A1", seatType: "STANDARD", price: 180 },
      { seatNumber: "A2", seatType: "STANDARD", price: 180 },
      { seatNumber: "B1", seatType: "PREMIUM", price: 260 },
    ]);

    expect(groups).toEqual([
      expect.objectContaining({ seatType: "STANDARD", count: 2, total: 360 }),
      expect.objectContaining({ seatType: "PREMIUM", count: 1, total: 260 }),
    ]);
  });

  test("uses booking pricing snapshots before legacy fallback", () => {
    const booking = {
      ticketPrice: 200,
      ticketAmount: 440,
      amount: 475.4,
      convenienceFee: 35.4,
      seats: ["A1", "B1"],
      seatPricing: [
        { seatNumber: "A1", seatType: "STANDARD", price: 180 },
        { seatNumber: "B1", seatType: "PREMIUM", price: 260 },
      ],
    };

    expect(getBookingTicketAmount(booking)).toBe(440);
    expect(getBookingPaidTotal(booking)).toBe(475.4);
    expect(getBookingSeatPricing(booking)).toEqual([
      expect.objectContaining({ seatNumber: "A1", seatType: "STANDARD", price: 180 }),
      expect.objectContaining({ seatNumber: "B1", seatType: "PREMIUM", price: 260 }),
    ]);
  });

  test("falls back for legacy bookings without pricing snapshots", () => {
    const booking = {
      ticketPrice: 200,
      convenienceFee: 35.4,
      seatType: "Standard",
      seats: ["A1", "A2"],
    };

    expect(getBookingTicketAmount(booking)).toBe(400);
    expect(getBookingPaidTotal(booking)).toBe(435.4);
    expect(getBookingSeatPricing(booking)).toEqual([
      expect.objectContaining({ seatNumber: "A1", seatType: "STANDARD", price: 200 }),
      expect.objectContaining({ seatNumber: "A2", seatType: "STANDARD", price: 200 }),
    ]);
  });
});
