import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import OrderHistory from "./Bookings";
import { renderWithProviders } from "../../../test/renderWithProviders";

const bookingHookState = vi.hoisted(() => ({
  getUserBookingsMock: vi.fn(),
  userBookings: [],
  loading: false,
  error: null,
}));

const authHookState = vi.hoisted(() => ({
  user: { id: "user-1", role: "user" },
}));

const canonicalBooking = {
  movieTitle: "Dune",
  theatreName: "PVR Forum",
  screenName: "Screen 2",
  screenNumber: 2,
  poster: "poster.jpg",
  showDate: "2026-08-17",
  showTime: "18:00",
  seats: ["A1", "A2"],
  ticketPrice: 200,
  ticketAmount: 500,
  amount: 535.4,
  seatPricing: [
    { seatNumber: "A1", seatType: "STANDARD", price: 200 },
    { seatNumber: "A2", seatType: "PREMIUM", price: 300 },
  ],
  convenienceFee: 35.4,
  gstPercent: 18,
  ticketStatus: "Confirmed",
  seatType: "Standard",
  bookingId: "BMS1234",
  bookingTime: "2026-08-16T10:00:00Z",
  paymentMethod: "Razorpay",
};

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: authHookState.user,
  }),
}));

vi.mock("../../../hooks/useBooking", () => ({
  useBooking: () => ({
    userBookings: bookingHookState.userBookings,
    loading: bookingHookState.loading,
    error: bookingHookState.error,
    getUserBookings: bookingHookState.getUserBookingsMock,
  }),
}));

vi.mock("../../../utils/reminderUtils", () => ({
  scheduleBookingReminder: vi.fn(),
}));

vi.mock("../../../utils/notificationUtils", () => ({
  notify: vi.fn(),
}));

describe("OrderHistory", () => {
  beforeEach(() => {
    bookingHookState.getUserBookingsMock.mockClear();
    bookingHookState.userBookings = [canonicalBooking];
    bookingHookState.loading = false;
    bookingHookState.error = null;
    authHookState.user = { id: "user-1", role: "user" };
  });

  test("fetches canonical purchase history once for the authenticated user", async () => {
    const { rerender } = renderWithProviders(<OrderHistory />);

    await waitFor(() => {
      expect(bookingHookState.getUserBookingsMock).toHaveBeenCalledWith("user-1");
    });

    rerender(<OrderHistory />);

    expect(bookingHookState.getUserBookingsMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Dune/)).toBeInTheDocument();
    expect(screen.getAllByText("Screen 2").length).toBeGreaterThan(0);
    expect(screen.getByText("A1 Standard (₹200.00), A2 Premium (₹300.00)")).toBeInTheDocument();
    expect(screen.getByText("Ticket Amount")).toBeInTheDocument();
    expect(screen.getByText("₹500.00")).toBeInTheDocument();
    expect(screen.getByText("₹35.40")).toBeInTheDocument();
    expect(screen.getByText("₹535.40")).toBeInTheDocument();
    expect(screen.getByText("Razorpay")).toBeInTheDocument();
    expect(screen.getByText("BMS1234")).toBeInTheDocument();
    expect(screen.queryByText("Incl. of Tax")).not.toBeInTheDocument();
  });

  test("fetches canonical history even when stale bookings already exist", async () => {
    bookingHookState.userBookings = [{
      ...canonicalBooking,
      bookingId: "OLD-BMS1234",
      movieTitle: "Old Cached Booking",
    }];

    renderWithProviders(<OrderHistory />);

    await waitFor(() => {
      expect(bookingHookState.getUserBookingsMock).toHaveBeenCalledWith("user-1");
    });
    expect(screen.getByText("Old Cached Booking")).toBeInTheDocument();
  });

  test("uses _id as the authenticated user identifier when id is absent", async () => {
    authHookState.user = { _id: "mongo-user-1", role: "user" };

    renderWithProviders(<OrderHistory />);

    await waitFor(() => {
      expect(bookingHookState.getUserBookingsMock).toHaveBeenCalledWith("mongo-user-1");
    });
  });

  test("opens booking details modal with canonical movie, theatre, screen, seats, amount, and booking ID", async () => {
    renderWithProviders(<OrderHistory />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /view booking info/i }));

    const modal = await screen.findByRole("dialog", { name: /booking details/i });
    expect(within(modal).getByText("Dune")).toBeInTheDocument();
    expect(within(modal).getByText("PVR Forum")).toBeInTheDocument();
    expect(within(modal).getByText("Screen 2")).toBeInTheDocument();
    expect(within(modal).getByText("A1 Standard (₹200.00), A2 Premium (₹300.00)")).toBeInTheDocument();
    expect(within(modal).getByText("₹535.40")).toBeInTheDocument();
    expect(within(modal).getByText("BMS1234")).toBeInTheDocument();
  });

  test("uses legacy ticket price and seat type when seatPricing and ticketAmount snapshots are absent", () => {
    bookingHookState.userBookings = [{
      ...canonicalBooking,
      bookingId: "BMS5678",
      seats: ["Q10", "Q11"],
      seatPricing: [],
      ticketAmount: undefined,
      ticketPrice: 245,
      amount: 525.4,
      seatType: "Standard",
      paymentMethod: "Razorpay",
    }];

    renderWithProviders(<OrderHistory />);

    expect(screen.getByText("Q10 Standard (₹245.00), Q11 Standard (₹245.00)")).toBeInTheDocument();
    expect(screen.getByText("₹490.00")).toBeInTheDocument();
    expect(screen.getByText("₹525.40")).toBeInTheDocument();
  });

  test("omits payment metadata when the canonical booking only contains N/A", () => {
    bookingHookState.userBookings = [{
      ...canonicalBooking,
      bookingId: "BMS9999",
      paymentMethod: "N/A",
    }];

    renderWithProviders(<OrderHistory />);

    expect(screen.queryByText("PAYMENT METHOD")).not.toBeInTheDocument();
    expect(screen.queryByText("Online Payment")).not.toBeInTheDocument();
  });

  test("falls back to placeholder poster without fabricating missing movie metadata", () => {
    bookingHookState.userBookings = [{
      ...canonicalBooking,
      bookingId: "BMSPOSTER",
      poster: "",
    }];

    renderWithProviders(<OrderHistory />);

    const poster = screen.getByAltText("Movie Poster");
    expect(poster).toHaveAttribute("src", "/placeholder.svg");
    expect(screen.getByText("Dune")).toBeInTheDocument();
    expect(screen.getByText("PVR Forum")).toBeInTheDocument();

    fireEvent.error(poster);
    expect(poster).toHaveAttribute("src", "/placeholder.svg");
  });

  test("preserves booking transaction date/time separately from show date/time", () => {
    renderWithProviders(<OrderHistory />);

    expect(screen.getByText((_, element) => (
      element?.tagName === "STRONG" && element.textContent === "Mon, 17 Aug 2026 |  06:00 PM"
    ))).toBeInTheDocument();
    expect(screen.getByText("BOOKING DATE & TIME")).toBeInTheDocument();
    expect(document.body).toHaveTextContent("Aug 16 2026");
  });
});
