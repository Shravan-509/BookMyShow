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
  movie: { _id: "movie-1", movieName: "Dune" },
  theatre: { name: "PVR Forum" },
  date: "2026-08-17",
  time: "18:00",
};

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

  test("displays deterministic checkout pricing and convenience fee", () => {
    renderWithProviders(
      <PaymentSummary show={show} seats={["A1", "A2"]} handlePreviousStep={vi.fn()} />,
      { preloadedState: authState },
    );

    expect(screen.getByText("Ticket Price (2 × ₹200)")).toBeInTheDocument();
    expect(screen.getAllByText("₹400.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹35.40").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /pay ₹435.40 using upi/i })).toBeInTheDocument();
  });

  test("requests seat validation and Razorpay order with expected payload", async () => {
    const store = setupStore(authState);
    const originalDispatch = store.dispatch;
    store.dispatch = vi.fn(originalDispatch);
    renderWithProviders(
      <PaymentSummary show={show} seats={["A1", "A2"]} handlePreviousStep={vi.fn()} />,
      { store },
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /pay ₹435.40 using upi/i }));

    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "booking/validateSeatBookingRequest",
      payload: { showId: "show-1", seats: ["A1", "A2"] },
    }));

    act(() => {
      store.dispatch(validateSeatBookingSuccess({ success: true, data: {} }));
    });

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "booking/createRazorpayOrderRequest",
        payload: { showId: "show-1", seats: ["A1", "A2"], feePerTicket: 15 },
      }));
    });
  });

  test("successful booking navigates to purchase history", async () => {
    const { store } = renderWithProviders(
      <PaymentSummary show={show} seats={["A1", "A2"]} handlePreviousStep={vi.fn()} />,
      { preloadedState: authState },
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /pay ₹435.40 using upi/i }));

    act(() => {
      store.dispatch(validateSeatBookingSuccess({ success: true, data: {} }));
    });

    await waitFor(() => {
      expect(store.getState().booking.isPaymentProcessing).toBe(true);
    });

    act(() => {
      store.dispatch(createRazorpayOrderSuccess({
        id: "order_1",
        amount: 43540,
        receipt: "receipt_1",
        convenienceFee: 35.4,
      }));
    });

    await waitFor(() => {
      expect(window.Razorpay).toHaveBeenCalled();
    });

    act(() => {
      store.dispatch(bookSeatsSuccess({ bookingId: "BMS1234" }));
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/my-profile/purchase-history");
    }, { timeout: 2500 });
  });

  test("booking failure after payment displays support-oriented error", async () => {
    const { store } = renderWithProviders(
      <PaymentSummary show={show} seats={["A1", "A2"]} handlePreviousStep={vi.fn()} />,
      { preloadedState: authState },
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /pay ₹435.40 using upi/i }));

    act(() => {
      store.dispatch(validateSeatBookingSuccess({ success: true, data: {} }));
    });

    await waitFor(() => {
      expect(store.getState().booking.isPaymentProcessing).toBe(true);
    });

    act(() => {
      store.dispatch(createRazorpayOrderSuccess({
        id: "order_1",
        amount: 43540,
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
  });
});
