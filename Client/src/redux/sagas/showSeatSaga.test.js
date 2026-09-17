import { describe, expect, test, vi } from "vitest";
import { runSaga } from "redux-saga";
import { ShowSeatAPI } from "../../api/showSeat";
import {
  acquireSeatLockFailure,
  acquireSeatLockSuccess,
  fetchShowSeatsFailure,
  fetchShowSeatsSuccess,
  refreshSeatLockSuccess,
  releaseSeatLockSuccess,
} from "../slices/showSeatSlice";
import {
  acquireSeatLockSaga,
  fetchShowSeatsSaga,
  refreshSeatLockSaga,
  releaseSeatLockSaga,
} from "./showSeatSaga";

vi.mock("../../api/showSeat", () => ({
  ShowSeatAPI: {
    fetchByShow: vi.fn(),
    acquireLock: vi.fn(),
    refreshLock: vi.fn(),
    releaseLock: vi.fn(),
  },
}));

vi.mock("../../utils/notificationUtils", () => ({
  notify: vi.fn(),
}));

const inventory = {
  showId: "show-1",
  screenId: "screen-1",
  capacity: 2,
  layoutStatus: "INITIALIZED",
  seats: [],
};

describe("showSeatSaga", () => {
  test("fetches inventory for the requested show and dispatches success", async () => {
    const dispatched = [];
    ShowSeatAPI.fetchByShow.mockResolvedValue({
      success: true,
      data: inventory,
    });

    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      fetchShowSeatsSaga,
      { payload: { showId: "show-1" } },
    ).toPromise();

    expect(ShowSeatAPI.fetchByShow).toHaveBeenCalledWith("show-1");
    expect(dispatched).toContainEqual(fetchShowSeatsSuccess(inventory));
  });

  test("dispatches failure when the API reports an error", async () => {
    const dispatched = [];
    ShowSeatAPI.fetchByShow.mockResolvedValue({
      success: false,
      message: "Inventory unavailable",
    });

    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      fetchShowSeatsSaga,
      { payload: { showId: "show-1" } },
    ).toPromise();

    expect(dispatched).toContainEqual(fetchShowSeatsFailure("Inventory unavailable"));
  });

  test("dispatches failure when the request throws", async () => {
    const dispatched = [];
    ShowSeatAPI.fetchByShow.mockRejectedValue({
      response: { data: { message: "Network failed" } },
    });

    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      fetchShowSeatsSaga,
      { payload: { showId: "show-1" } },
    ).toPromise();

    expect(dispatched).toContainEqual(fetchShowSeatsFailure("Network failed"));
  });

  test("acquires a lock and preserves structured backend errors", async () => {
    const dispatched = [];
    const lock = {
      showId: "show-1",
      seats: ["A1"],
      lockToken: "server-token",
      lockExpiresAt: "expiry",
    };
    ShowSeatAPI.acquireLock.mockResolvedValueOnce({ success: true, data: lock });

    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      acquireSeatLockSaga,
      { payload: { showId: "show-1", seats: ["A1"] } },
    ).toPromise();

    expect(ShowSeatAPI.acquireLock).toHaveBeenCalledWith("show-1", ["A1"]);
    expect(dispatched).toContainEqual(acquireSeatLockSuccess(lock));

    ShowSeatAPI.acquireLock.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: "Seat already locked", code: "SEAT_ALREADY_LOCKED" },
      },
    });

    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      acquireSeatLockSaga,
      { payload: { showId: "show-1", seats: ["A1"] } },
    ).toPromise();

    expect(dispatched).toContainEqual(acquireSeatLockFailure({
      message: "Seat already locked",
      code: "SEAT_ALREADY_LOCKED",
      status: 409,
    }));
  });

  test("refreshes and releases using the current server token", async () => {
    const dispatched = [];
    const payload = { showId: "show-1", seats: ["A1"], lockToken: "server-token" };
    const refreshedLock = { ...payload, lockExpiresAt: "new-expiry" };
    ShowSeatAPI.refreshLock.mockResolvedValue({ success: true, data: refreshedLock });
    ShowSeatAPI.releaseLock.mockResolvedValue({
      success: true,
      data: { ...payload, lockExpiresAt: null, released: false },
    });

    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      refreshSeatLockSaga,
      { payload },
    ).toPromise();
    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      releaseSeatLockSaga,
      { payload },
    ).toPromise();

    expect(ShowSeatAPI.refreshLock).toHaveBeenCalledWith("show-1", ["A1"], "server-token");
    expect(dispatched).toContainEqual(refreshSeatLockSuccess(refreshedLock));
    expect(ShowSeatAPI.releaseLock).toHaveBeenCalledWith("show-1", ["A1"], "server-token");
    expect(dispatched).toContainEqual(releaseSeatLockSuccess({
      ...payload,
      lockExpiresAt: null,
      released: false,
    }));
  });
});
