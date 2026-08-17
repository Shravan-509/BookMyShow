import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import TheatreBookings from "./TheatreBooking";
import { renderWithProviders, setupStore } from "../../../test/renderWithProviders";

const theatres = [
  { _id: "theatre-1", name: "PVR Forum", address: "Koramangala", isActive: true },
  { _id: "theatre-2", name: "INOX Mall", address: "Indiranagar", isActive: true },
];

describe("TheatreBookings", () => {
  test("loads first theatre bookings and allows partner theatre selection", async () => {
    const store = setupStore({
        theatre: {
          loading: false,
          error: null,
          theatre: theatres,
        },
        booking: {
          loading: false,
          error: null,
          validationResult: null,
          bookingData: null,
          userBookings: [],
          allBookings: [],
          theatreBookings: [
            {
              _id: "booking-1",
              bookingId: "BMS1234",
              userName: "User One",
              userEmail: "user@example.com",
              userPhone: "9876543210",
              movieTitle: "Dune",
              showDate: "2026-08-17",
              showTime: "18:00",
              seats: ["A1", "A2"],
              amount: 435.4,
              ticketStatus: "Confirmed",
              bookingTime: "2026-08-16T10:00:00Z",
              revenueData: null,
              razorpayOrder: null,
              isPaymentProcessing: false,
              paymentError: null,
            },
          ],
          revenueData: null,
          razorpayOrder: null,
          isPaymentProcessing: false,
          paymentError: null,
        },
    });
    const originalDispatch = store.dispatch;
    store.dispatch = vi.fn(originalDispatch);
    renderWithProviders(<TheatreBookings />, { store });
    const user = userEvent.setup();

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "booking/getTheatreBookingsRequest",
        payload: "theatre-1",
      }));
    });

    await user.click(screen.getByText("PVR Forum"));
    await user.click(await screen.findByText("INOX Mall"));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "booking/getTheatreBookingsRequest",
        payload: "theatre-2",
      }));
    });
  });
});
