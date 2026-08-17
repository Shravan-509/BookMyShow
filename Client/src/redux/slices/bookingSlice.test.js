import { describe, expect, test } from "vitest";
import bookingReducer, {
  bookSeatsFailure,
  bookSeatsRequest,
  bookSeatsSuccess,
  clearBookingData,
  clearValidationResult,
  createRazorpayOrderFailure,
  createRazorpayOrderRequest,
  createRazorpayOrderSuccess,
  getUserBookingsFailure,
  getUserBookingsRequest,
  getUserBookingsSuccess,
  validateSeatBookingFailure,
  validateSeatBookingRequest,
  validateSeatBookingSuccess,
} from "./bookingSlice";

describe("bookingSlice", () => {
  test("handles seat validation request, success, failure, and clearing", () => {
    let state = bookingReducer(undefined, validateSeatBookingRequest());
    expect(state.loading).toBe(true);
    expect(state.validationResult).toBe(null);

    state = bookingReducer(state, validateSeatBookingSuccess({ success: true }));
    expect(state.loading).toBe(false);
    expect(state.validationResult).toEqual({ success: true });

    state = bookingReducer(state, clearValidationResult());
    expect(state.validationResult).toBe(null);

    state = bookingReducer(state, validateSeatBookingFailure("Seat unavailable"));
    expect(state.loading).toBe(false);
    expect(state.error).toBe("Seat unavailable");
  });

  test("handles booking request, success, failure, and clearing", () => {
    let state = bookingReducer(undefined, bookSeatsRequest());
    expect(state.loading).toBe(true);
    expect(state.bookingData).toBe(null);

    state = bookingReducer(state, bookSeatsSuccess({ bookingId: "BMS1234" }));
    expect(state.bookingData).toEqual({ bookingId: "BMS1234" });
    expect(state.error).toBe(null);

    state = bookingReducer(state, clearBookingData());
    expect(state.bookingData).toBe(null);

    state = bookingReducer(state, bookSeatsFailure("Payment failed"));
    expect(state.bookingData).toBe(null);
    expect(state.error).toBe("Payment failed");
  });

  test("handles Razorpay order request, success, and failure", () => {
    let state = bookingReducer(undefined, createRazorpayOrderRequest());
    expect(state.isPaymentProcessing).toBe(true);
    expect(state.razorpayOrder).toBe(null);

    state = bookingReducer(state, createRazorpayOrderSuccess({ id: "order_1" }));
    expect(state.isPaymentProcessing).toBe(false);
    expect(state.razorpayOrder).toEqual({ id: "order_1" });

    state = bookingReducer(state, createRazorpayOrderFailure("Order failed"));
    expect(state.isPaymentProcessing).toBe(false);
    expect(state.razorpayOrder).toBe(null);
    expect(state.paymentError).toBe("Order failed");
  });

  test("handles purchase history request, success, and failure", () => {
    let state = bookingReducer(undefined, getUserBookingsRequest());
    expect(state.loading).toBe(true);

    state = bookingReducer(state, getUserBookingsSuccess([{ bookingId: "BMS1234" }]));
    expect(state.loading).toBe(false);
    expect(state.userBookings).toEqual([{ bookingId: "BMS1234" }]);

    state = bookingReducer(state, getUserBookingsFailure("Could not fetch"));
    expect(state.userBookings).toEqual([]);
    expect(state.error).toBe("Could not fetch");
  });
});
