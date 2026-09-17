import { describe, expect, test } from "vitest";
import showSeatReducer, {
  acquireSeatLockFailure,
  acquireSeatLockRequest,
  acquireSeatLockSuccess,
  clearShowSeats,
  clearFrontendSeatLockState,
  fetchShowSeatsFailure,
  fetchShowSeatsRequest,
  fetchShowSeatsSuccess,
  refreshSeatLockRequest,
  refreshSeatLockSuccess,
  releaseSeatLockFailure,
  releaseSeatLockRequest,
  releaseSeatLockSuccess,
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
    expect(state.inventory).toBe(null);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
  });

  test("stores lock lifecycle independently from inventory", () => {
    const lock = {
      showId: "show-1",
      seats: ["A1", "A2"],
      lockToken: "server-token",
      lockExpiresAt: "2026-09-17T10:07:00.000Z",
    };
    let state = showSeatReducer(undefined, { type: "initial" });

    expect(state.lock).toBe(null);
    expect(state.lockLoading).toBe(false);

    state = showSeatReducer(state, acquireSeatLockRequest({ showId: "show-1", seats: lock.seats }));
    expect(state.lockLoading).toBe(true);
    expect(state.lockError).toBe(null);

    state = showSeatReducer(state, acquireSeatLockSuccess(lock));
    expect(state.lock).toEqual(lock);
    expect(state.lockLoading).toBe(false);

    const structuredError = { message: "Seat already locked", code: "SEAT_ALREADY_LOCKED", status: 409 };
    state = showSeatReducer(state, acquireSeatLockFailure(structuredError));
    expect(state.lock).toEqual(lock);
    expect(state.lockError).toEqual(structuredError);
    expect(state.inventory).toBe(null);
  });

  test("refresh updates only the server expiry for the matching lock", () => {
    const lock = {
      showId: "show-1",
      seats: ["A1"],
      lockToken: "server-token",
      lockExpiresAt: "old-expiry",
    };
    let state = showSeatReducer(undefined, acquireSeatLockSuccess(lock));

    state = showSeatReducer(state, refreshSeatLockRequest(lock));
    expect(state.refreshLoading).toBe(true);

    state = showSeatReducer(state, refreshSeatLockSuccess({
      ...lock,
      seats: ["unexpected-seat"],
      lockExpiresAt: "new-expiry",
    }));
    expect(state.lock).toEqual({ ...lock, lockExpiresAt: "new-expiry" });

    state = showSeatReducer(state, refreshSeatLockSuccess({
      ...lock,
      lockToken: "stale-token",
      lockExpiresAt: "stale-expiry",
    }));
    expect(state.lock.lockExpiresAt).toBe("new-expiry");
  });

  test("release clears only a matching lock, including released false", () => {
    const lock = {
      showId: "show-1",
      seats: ["A1"],
      lockToken: "server-token",
      lockExpiresAt: "expiry",
    };
    let state = showSeatReducer(undefined, acquireSeatLockSuccess(lock));

    state = showSeatReducer(state, releaseSeatLockRequest(lock));
    expect(state.releaseLoading).toBe(true);

    state = showSeatReducer(state, releaseSeatLockSuccess({
      showId: "show-1",
      lockToken: "other-token",
      released: true,
    }));
    expect(state.lock).toEqual(lock);

    state = showSeatReducer(state, releaseSeatLockSuccess({
      showId: "show-1",
      lockToken: "server-token",
      released: false,
    }));
    expect(state.lock).toBe(null);
  });

  test("release failure preserves the lock and local clear resets frontend lock state", () => {
    const lock = {
      showId: "show-1",
      seats: ["A1"],
      lockToken: "server-token",
      lockExpiresAt: "expiry",
    };
    const error = { message: "Not owned", code: "SEAT_LOCK_NOT_OWNED", status: 403 };
    let state = showSeatReducer(undefined, acquireSeatLockSuccess(lock));

    state = showSeatReducer(state, releaseSeatLockFailure(error));
    expect(state.lock).toEqual(lock);
    expect(state.releaseError).toEqual(error);

    state = showSeatReducer(state, clearFrontendSeatLockState());
    expect(state.lock).toBe(null);
    expect(state.lockError).toBe(null);
    expect(state.refreshError).toBe(null);
    expect(state.releaseError).toBe(null);
  });
});
