import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import OrderHistory from "./Bookings";
import { renderWithProviders } from "../../../test/renderWithProviders";

const getUserBookingsMock = vi.fn();

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", role: "user" },
  }),
}));

vi.mock("../../../hooks/useBooking", () => ({
  useBooking: () => ({
    userBookings: [
      {
        movieTitle: "Dune",
        theatreName: "PVR Forum",
        poster: "poster.jpg",
        showDate: "2026-08-17",
        showTime: "18:00",
        seats: ["A1", "A2"],
        ticketPrice: 200,
        convenienceFee: 35.4,
        gstPercent: 18,
        ticketStatus: "Confirmed",
        seatType: "Standard",
        bookingId: "BMS1234",
        bookingTime: "2026-08-16T10:00:00Z",
        paymentMethod: "Razorpay",
      },
    ],
    loading: false,
    error: null,
    getUserBookings: getUserBookingsMock,
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
    getUserBookingsMock.mockClear();
  });

  test("fetches purchase history once for the authenticated user", async () => {
    const { rerender } = renderWithProviders(<OrderHistory />);

    await waitFor(() => {
      expect(getUserBookingsMock).toHaveBeenCalledWith("user-1");
    });

    rerender(<OrderHistory />);

    expect(getUserBookingsMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Dune/)).toBeInTheDocument();
    expect(screen.getByText("BMS1234")).toBeInTheDocument();
  });

  test("opens booking details modal", async () => {
    renderWithProviders(<OrderHistory />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /view booking info/i }));

    expect(await screen.findByText("Booking Details")).toBeInTheDocument();
    expect(screen.getAllByText("BMS1234").length).toBeGreaterThan(1);
  });
});
