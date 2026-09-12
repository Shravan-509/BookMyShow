import { describe, expect, test, vi } from "vitest";
import { runSaga } from "redux-saga";
import { ShowSeatAPI } from "../../api/showSeat";
import { fetchShowSeatsFailure, fetchShowSeatsSuccess } from "../slices/showSeatSlice";
import { fetchShowSeatsSaga } from "./showSeatSaga";

vi.mock("../../api/showSeat", () => ({
  ShowSeatAPI: {
    fetchByShow: vi.fn(),
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
});
