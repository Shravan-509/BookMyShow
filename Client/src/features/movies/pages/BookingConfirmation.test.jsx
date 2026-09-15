import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import BookingConfirmation from "./BookingConfirmation";
import { setupStore } from "../../../test/renderWithProviders";

const authState = {
  auth: {
    user: {
      id: "user-1",
      name: "User One",
      email: "user@example.com",
      phone: "9876543210",
      role: "user",
    },
    token: "token",
    isAuthenticated: true,
    loading: false,
    checkingAuth: false,
    error: null,
  },
};

const booking = {
  _id: "booking-mongo-id",
  bookingId: "BMS1234",
  seats: ["B12", "B13", "C5"],
  ticketAmount: 520,
  seatPricing: [
    { seatNumber: "B12", seatType: "STANDARD", price: 150 },
    { seatNumber: "B13", seatType: "STANDARD", price: 150 },
    { seatNumber: "C5", seatType: "PREMIUM", price: 220 },
  ],
  convenienceFee: 40.12,
  amount: 560.12,
  ticketStatus: "Confirmed",
  paymentMethod: "Razorpay",
  transactionId: "pay_sensitive_1",
  orderId: "order_sensitive_1",
};

const show = {
  _id: "show-1",
  ticketPrice: 150,
  movie: {
    movieName: "Michael (2026)",
    poster: "michael.jpg",
    duration: 128,
  },
  theatre: {
    name: "Jagadamba Complex A/C 4K Dolby Atmos : Vizag",
  },
  screen: {
    name: "SARADA 4K",
    screenNumber: 2,
  },
  date: "2026-09-16",
  time: "14:30",
};

const renderConfirmation = ({ routeState, preloadedState = authState } = {}) => {
  const store = setupStore(preloadedState);

  return render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/booking-confirmation/BMS1234",
            state: routeState,
          },
        ]}
      >
        <Routes>
          <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
          <Route path="/my-profile/purchase-history" element={<div>Purchase History</div>} />
          <Route path="/home" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe("BookingConfirmation", () => {
  test("renders confirmed booking details from navigation state", () => {
    renderConfirmation({
      routeState: {
        booking,
        bookingContext: {
          show,
          seats: booking.seats,
          screenDisplayName: "SARADA 4K / Screen 2",
          formattedShowDate: "Wed, 16 Sep, 2026",
          formattedShowTime: "02:30 PM",
        },
      },
    });

    expect(screen.getByRole("heading", { name: "Booking Confirmed!" })).toBeInTheDocument();
    expect(screen.getByText("Showtime", { selector: ".booking-progress-title" }).closest(".booking-progress-step")).toHaveClass("complete");
    expect(screen.getByText("Seats", { selector: ".booking-progress-title" }).closest(".booking-progress-step")).toHaveClass("complete");
    expect(screen.getByText("Checkout", { selector: ".booking-progress-title" }).closest(".booking-progress-step")).toHaveClass("complete");
    expect(screen.getByText("Confirmation", { selector: ".booking-progress-title" }).closest(".booking-progress-step")).toHaveClass("active");
    expect(screen.getByLabelText("Step 4: Confirmation, current")).toHaveAttribute("aria-current", "step");

    const successBanner = screen.getByLabelText("Booking confirmation summary");
    expect(within(successBanner).getByText("BMS1234")).toBeInTheDocument();
    expect(within(successBanner).queryByText("Michael (2026)")).not.toBeInTheDocument();
    expect(within(successBanner).queryByAltText("Michael (2026) poster")).not.toBeInTheDocument();

    const ticketDetails = screen.getByLabelText("Ticket details");
    expect(within(ticketDetails).getByText("Michael (2026)")).toBeInTheDocument();
    expect(within(ticketDetails).getByAltText("Michael (2026) poster")).toBeInTheDocument();
    expect(within(ticketDetails).getByText("Jagadamba Complex A/C 4K Dolby Atmos : Vizag")).toBeInTheDocument();
    expect(within(ticketDetails).getByText(/SARADA 4K \/ Screen 2/)).toBeInTheDocument();
    expect(within(ticketDetails).getByText(/Wed, 16 Sep, 2026/)).toBeInTheDocument();
    expect(screen.getAllByText(/B12, B13, C5/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Standard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Premium").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹520.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹560.12").length).toBeGreaterThan(0);

    const bookingSummary = screen.getByLabelText("Booking summary");
    expect(within(bookingSummary).getByText("Michael (2026)")).toBeInTheDocument();
    expect(within(bookingSummary).queryByText("Theatre")).not.toBeInTheDocument();
    expect(within(bookingSummary).queryByText("Screen")).not.toBeInTheDocument();
    expect(within(bookingSummary).queryByText("Date & Time")).not.toBeInTheDocument();
    expect(within(bookingSummary).queryByText("Jagadamba Complex A/C 4K Dolby Atmos : Vizag")).not.toBeInTheDocument();
    expect(within(bookingSummary).queryByText(/SARADA 4K \/ Screen 2/)).not.toBeInTheDocument();

    const qrBlock = screen.getByLabelText("Booking QR code");
    expect(qrBlock).toBeInTheDocument();
    expect(within(qrBlock).getByText("Entry QR Code")).toBeInTheDocument();
    expect(within(qrBlock).getByText("Scan this code at the cinema entrance.")).toBeInTheDocument();
    expect(within(qrBlock).getByText("BMS1234")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View My Bookings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explore More Movies" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download Ticket unavailable" })).toBeDisabled();
    expect(screen.getByText("Email delivery only")).toBeInTheDocument();
    expect(screen.queryByText(/held|countdown|lock expires|reserved until/i)).not.toBeInTheDocument();
    expect(screen.queryByText("pay_sensitive_1")).not.toBeInTheDocument();
    expect(screen.queryByText("order_sensitive_1")).not.toBeInTheDocument();
  });

  test("falls back to legacy flat pricing when booking snapshots are missing", () => {
    renderConfirmation({
      routeState: {
        booking: {
          bookingId: "BMS1234",
          seats: ["A1", "A2"],
          ticketPrice: 175,
          seatType: "Standard",
          convenienceFee: 20,
        },
        bookingContext: {
          show: {
            ...show,
            ticketPrice: 175,
            ticketPricing: {},
          },
          seats: ["A1", "A2"],
          screenDisplayName: "SARADA 4K / Screen 2",
          formattedShowDate: "Wed, 16 Sep, 2026",
          formattedShowTime: "02:30 PM",
        },
      },
    });

    expect(screen.getByRole("heading", { name: "Booking Confirmed!" })).toBeInTheDocument();
    expect(screen.getAllByText("Standard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹350.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹370.00").length).toBeGreaterThan(0);
  });

  test("uses graceful recovery when confirmation data is not available after refresh", async () => {
    renderConfirmation();
    const user = userEvent.setup();

    expect(screen.getByRole("heading", { name: "Booking details are available in My Bookings" })).toBeInTheDocument();
    expect(screen.queryByText("Booking failed")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View My Bookings" }));

    expect(await screen.findByText("Purchase History")).toBeInTheDocument();
  });
});
