import { beforeEach, describe, expect, test, vi } from "vitest";
import { axiosInstance } from ".";
import { BookingAPI } from "./booking";

vi.mock(".", () => ({
  axiosInstance: {
    post: vi.fn(),
  },
}));

describe("BookingAPI lock token contract", () => {
  beforeEach(() => {
    axiosInstance.post.mockReset();
    axiosInstance.post.mockResolvedValue({ data: { success: true } });
  });

  test("includes the lock token in initialized create-order and booking requests", async () => {
    await BookingAPI.createRazorPayOrder({
      showId: "show-1",
      seats: ["A1"],
      feePerTicket: 15,
      lockToken: "server-token",
    });
    await BookingAPI.bookSeats({
      show: "show-1",
      seats: ["A1"],
      orderId: "order-1",
      lockToken: "server-token",
    });

    expect(axiosInstance.post).toHaveBeenNthCalledWith(1, "/bookings/createOrder", {
      showId: "show-1",
      seats: ["A1"],
      feePerTicket: 15,
      lockToken: "server-token",
    });
    expect(axiosInstance.post).toHaveBeenNthCalledWith(2, "/bookings/bookSeat", {
      show: "show-1",
      seats: ["A1"],
      orderId: "order-1",
      lockToken: "server-token",
    });
  });

  test("omits absent lock tokens from legacy create-order and booking requests", async () => {
    await BookingAPI.createRazorPayOrder({
      showId: "legacy-show",
      seats: ["B1"],
      feePerTicket: 15,
      lockToken: undefined,
    });
    await BookingAPI.bookSeats({
      show: "legacy-show",
      seats: ["B1"],
      orderId: "order-2",
      lockToken: null,
    });

    expect(axiosInstance.post).toHaveBeenNthCalledWith(1, "/bookings/createOrder", {
      showId: "legacy-show",
      seats: ["B1"],
      feePerTicket: 15,
    });
    expect(axiosInstance.post).toHaveBeenNthCalledWith(2, "/bookings/bookSeat", {
      show: "legacy-show",
      seats: ["B1"],
      orderId: "order-2",
    });
  });
});
