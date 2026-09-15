import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import PaymentSummary from "./Checkout";
import { renderWithProviders, setupStore } from "../../../test/renderWithProviders";
import {
  bookSeatsSuccess,
  createRazorpayOrderSuccess,
  validateSeatBookingSuccess,
} from "../../../redux/slices/bookingSlice";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../../utils/notificationUtils", () => ({
  notify: vi.fn(),
}));

const show = {
  _id: "show-1",
  ticketPrice: 200,
  ticketPricing: {
    STANDARD: 200,
    PREMIUM: 300,
    RECLINER: 400,
  },
  movie: { _id: "movie-1", movieName: "Dune" },
  theatre: { name: "PVR Forum" },
  screen: { name: "Screen 2", screenNumber: 2 },
  date: "2026-08-17",
  time: "18:00",
};

const showSeats = [
  { seatNumber: "A1", seatType: "STANDARD" },
  { seatNumber: "A2", seatType: "PREMIUM" },
  { seatNumber: "A3", seatType: "RECLINER" },
];

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

describe("PaymentSummary checkout flow", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    vi.spyOn(Math, "random").mockReturnValue(0);
    window.Razorpay = vi.fn(function RazorpayMock(options) {
      return {
      open: vi.fn(() => {
        options.handler({
          razorpay_payment_id: "pay_1",
          razorpay_order_id: "order_1",
          razorpay_signature: "sig_1",
        });
      }),
      };
    });
  });

  test("renders redesigned checkout context, progress-ready summary, and mixed pricing", () => {
    renderWithProviders(
      <PaymentSummary show={show} seats={["A1", "A2", "A3"]} showSeats={showSeats} handlePreviousStep={vi.fn()} />,
      { preloadedState: authState },
    );

    expect(screen.getByRole("heading", { name: "Complete Your Booking" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contact Details" })).toBeInTheDocument();
    expect(screen.getByText("Razorpay Secure Checkout")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your Booking" })).toBeInTheDocument();
    expect(screen.getByText("PVR Forum")).toBeInTheDocument();
    expect(screen.getByText("Screen 2")).toBeInTheDocument();
    expect(screen.getByText(/Mon, 17 Aug, 2026/).closest(".booking-summary-details")).toHaveTextContent("06:00 PM");
    expect(screen.getByText("A1, A2, A3")).toBeInTheDocument();
    expect(screen.getByText("Standard")).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("Recliner")).toBeInTheDocument();
    expect(screen.getByText("3 Tickets")).toBeInTheDocument();
    expect(screen.getAllByText("₹900.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹53.10").length).toBeGreaterThan(0);
    expect(screen.getByText("Base Convenience Fee")).toBeInTheDocument();
    expect(screen.getByText("GST @18%")).toBeInTheDocument();
    expect(screen.queryByText(/Integrated GST/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/IGST/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pay ₹953.10 with razorpay/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /pay .* with razorpay/i })).toHaveLength(1);
    expect(screen.queryByText(/held|countdown|lock expires|reserved until/i)).not.toBeInTheDocument();
  });

  test("legacy no-screen checkout renders safely with flat ticket pricing", () => {
    renderWithProviders(
      <PaymentSummary show={{ ...show, screen: null }} seats={["B1"]} showSeats={[]} handlePreviousStep={vi.fn()} />,
      { preloadedState: authState },
    );

    expect(screen.queryByText("Screen 2")).not.toBeInTheDocument();
    expect(screen.getAllByText("B1").length).toBeGreaterThan(0);
    expect(screen.getByText("1 Ticket")).toBeInTheDocument();
    expect(screen.getAllByText("₹200.00").length).toBeGreaterThan(0);
  });

  test("requests seat validation and Razorpay order with expected payload", async () => {
    const store = setupStore(authState);
    const originalDispatch = store.dispatch;
    store.dispatch = vi.fn(originalDispatch);
    renderWithProviders(
      <PaymentSummary show={show} seats={["A1", "A2"]} showSeats={showSeats} handlePreviousStep={vi.fn()} />,
      { store },
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /pay ₹535.40 with razorpay/i }));

    expect(screen.getByText("Validating selected seats...")).toBeInTheDocument();
    expect(document.querySelector(".checkout-status-card")).not.toBeInTheDocument();

    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "booking/validateSeatBookingRequest",
      payload: { showId: "show-1", seats: ["A1", "A2"] },
    }));
    expect(store.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({
      type: "booking/createRazorpayOrderRequest",
      payload: expect.objectContaining({
        ticketAmount: expect.anything(),
      }),
    }));

    act(() => {
      store.dispatch(validateSeatBookingSuccess({ success: true, data: {} }));
    });

    expect(await screen.findByText("Creating secure payment order...")).toBeInTheDocument();

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "booking/createRazorpayOrderRequest",
        payload: { showId: "show-1", seats: ["A1", "A2"], feePerTicket: 15 },
      }));
    });
  });

  test("Edit Seats returns to seat selection without changing selected seats", async () => {
    const handlePreviousStep = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <PaymentSummary show={show} seats={["A1", "A2"]} showSeats={showSeats} handlePreviousStep={handlePreviousStep} />,
      { preloadedState: authState },
    );

    await user.click(screen.getByRole("button", { name: "Edit selected seats" }));

    expect(handlePreviousStep).toHaveBeenCalledTimes(1);
    expect(screen.getByText("A1, A2")).toBeInTheDocument();
  });

  test("successful booking navigates to booking confirmation with booking context", async () => {
    const { store } = renderWithProviders(
      <PaymentSummary show={show} seats={["A1", "A2"]} showSeats={showSeats} handlePreviousStep={vi.fn()} />,
      { preloadedState: authState },
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /pay ₹535.40 with razorpay/i }));

    act(() => {
      store.dispatch(validateSeatBookingSuccess({ success: true, data: {} }));
    });

    await waitFor(() => {
      expect(store.getState().booking.isPaymentProcessing).toBe(true);
    });

    act(() => {
      store.dispatch(createRazorpayOrderSuccess({
        id: "order_1",
        amount: 53540,
        receipt: "receipt_1",
        convenienceFee: 35.4,
      }));
    });

    await waitFor(() => {
      expect(window.Razorpay).toHaveBeenCalled();
    });

    expect(navigateMock).not.toHaveBeenCalledWith(
      expect.stringMatching(/^\/booking-confirmation\//),
      expect.anything(),
    );

    act(() => {
      store.dispatch(bookSeatsSuccess({
        bookingId: "BMS1234",
        seats: ["A1", "A2"],
        ticketAmount: 500,
        seatPricing: [
          { seatNumber: "A1", seatType: "STANDARD", price: 200 },
          { seatNumber: "A2", seatType: "PREMIUM", price: 300 },
        ],
        convenienceFee: 35.4,
        amount: 535.4,
      }));
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        "/booking-confirmation/BMS1234",
        expect.objectContaining({
          state: expect.objectContaining({
            booking: expect.objectContaining({ bookingId: "BMS1234" }),
            bookingContext: expect.objectContaining({
              show,
              seats: ["A1", "A2"],
              ticketAmount: 500,
              convenienceFee: 35.4,
              totalAmount: 535.4,
              screenDisplayName: "Screen 2",
            }),
          }),
        }),
      );
    });
  });

  test("booking failure after payment displays support-oriented error", async () => {
    const { store } = renderWithProviders(
      <PaymentSummary show={show} seats={["A1", "A2"]} showSeats={showSeats} handlePreviousStep={vi.fn()} />,
      { preloadedState: authState },
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /pay ₹535.40 with razorpay/i }));

    act(() => {
      store.dispatch(validateSeatBookingSuccess({ success: true, data: {} }));
    });

    await waitFor(() => {
      expect(store.getState().booking.isPaymentProcessing).toBe(true);
    });

    act(() => {
      store.dispatch(createRazorpayOrderSuccess({
        id: "order_1",
        amount: 53540,
        receipt: "receipt_1",
      }));
    });

    await waitFor(() => {
      expect(window.Razorpay).toHaveBeenCalled();
    });

    act(() => {
      store.dispatch({
        type: "booking/bookSeatsFailure",
        payload: "Server rejected booking",
      });
    });

    expect(await screen.findByText(/booking failed after payment/i)).toBeInTheDocument();
    expect(screen.getByText(/pay_1/)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalledWith(
      expect.stringMatching(/^\/booking-confirmation\//),
      expect.anything(),
    );
  });
});
