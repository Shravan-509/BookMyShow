import { beforeEach, describe, expect, test, vi } from "vitest";
import { runSaga } from "redux-saga";
import { BookingAPI } from "../../api/booking";
import { bookSeatsSuccess, createRazorpayOrderSuccess } from "../slices/bookingSlice";
import { bookSeatsSaga, createRazorpayOrderSaga } from "./bookingSaga";

vi.mock("../../api/booking", () => ({
  BookingAPI: {
    bookSeats: vi.fn(),
    createRazorPayOrder: vi.fn(),
  },
}));

vi.mock("../../utils/notificationUtils", () => ({
  notify: vi.fn(),
}));

describe("bookingSaga lock token plumbing", () => {
  beforeEach(() => {
    sessionStorage.clear();
    BookingAPI.bookSeats.mockReset();
    BookingAPI.createRazorPayOrder.mockReset();
  });

  test("passes lockToken to createOrder without persisting the sensitive token", async () => {
    const dispatched = [];
    const payload = {
      showId: "show-1",
      seats: ["A1"],
      feePerTicket: 15,
      lockToken: "server-token",
    };
    BookingAPI.createRazorPayOrder.mockResolvedValue({
      success: true,
      data: { id: "order-1" },
    });

    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      createRazorpayOrderSaga,
      { payload },
    ).toPromise();

    expect(BookingAPI.createRazorPayOrder).toHaveBeenCalledWith(payload);
    expect(dispatched).toContainEqual(createRazorpayOrderSuccess({ id: "order-1" }));
    expect(JSON.parse(sessionStorage.getItem("pendingBookingData"))).toEqual({
      showId: "show-1",
      seats: ["A1"],
      feePerTicket: 15,
    });
  });

  test("passes the same lockToken through the final booking request", async () => {
    const dispatched = [];
    const payload = {
      show: "show-1",
      seats: ["A1"],
      orderId: "order-1",
      lockToken: "server-token",
    };
    BookingAPI.bookSeats.mockResolvedValue({
      success: true,
      data: { bookingId: "BMS1001" },
    });

    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      bookSeatsSaga,
      { payload },
    ).toPromise();

    expect(BookingAPI.bookSeats).toHaveBeenCalledWith(payload);
    expect(dispatched).toContainEqual(bookSeatsSuccess({ bookingId: "BMS1001" }));
  });
});
