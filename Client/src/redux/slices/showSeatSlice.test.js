import { describe, expect, test } from "vitest";
import showSeatReducer, {
  clearShowSeats,
  fetchShowSeatsFailure,
  fetchShowSeatsRequest,
  fetchShowSeatsSuccess,
} from "./showSeatSlice";

const inventory = {
  showId: "show-1",
  screenId: "screen-1",
  screenName: "Screen 1",
  screenNumber: 1,
  capacity: 2,
  layoutStatus: "INITIALIZED",
  seats: [
    {
      showSeatId: "show-seat-1",
      seatId: "seat-1",
      seatNumber: "A1",
      row: "A",
      column: 1,
      seatType: "STANDARD",
      status: "AVAILABLE",
    },
  ],
};

describe("showSeatSlice", () => {
  test("handles request, success, failure, and clear lifecycle", () => {
    let state = showSeatReducer({ inventory, loading: false, error: "old error" }, fetchShowSeatsRequest({ showId: "show-2" }));
    expect(state.loading).toBe(true);
    expect(state.error).toBe(null);
    expect(state.inventory).toBe(null);

    state = showSeatReducer(state, fetchShowSeatsSuccess(inventory));
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
    expect(state.inventory).toEqual(inventory);

    state = showSeatReducer(state, fetchShowSeatsFailure("Inventory unavailable"));
    expect(state.loading).toBe(false);
    expect(state.error).toBe("Inventory unavailable");
    expect(state.inventory).toBe(null);

    state = showSeatReducer({ inventory, loading: true, error: "bad" }, clearShowSeats());
    expect(state).toEqual({ inventory: null, loading: false, error: null });
  });
});
