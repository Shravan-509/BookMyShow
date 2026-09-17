import { describe, expect, test, vi } from "vitest";
import { axiosInstance } from ".";
import { ShowSeatAPI } from "./showSeat";

vi.mock(".", () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("ShowSeatAPI", () => {
  test("fetches ShowSeat inventory for a show using the authenticated API client", async () => {
    const response = {
      success: true,
      data: {
        showId: "show-1",
        layoutStatus: "INITIALIZED",
        seats: [],
      },
    };
    axiosInstance.get.mockResolvedValue({ data: response });

    await expect(ShowSeatAPI.fetchByShow("show-1")).resolves.toEqual(response);

    expect(axiosInstance.get).toHaveBeenCalledWith("/shows/show-1/seats");
  });

  test("acquires a lock without sending a client-generated token", async () => {
    axiosInstance.post.mockResolvedValue({ data: { success: true, data: {} } });

    await ShowSeatAPI.acquireLock("show-1", ["A1", "A2"]);

    expect(axiosInstance.post).toHaveBeenCalledWith(
      "/shows/show-1/seats/lock",
      { seats: ["A1", "A2"] },
    );
  });

  test("refreshes and releases a lock with its server-issued token", async () => {
    axiosInstance.post.mockResolvedValue({ data: { success: true, data: {} } });

    await ShowSeatAPI.refreshLock("show-1", ["A1"], "lock-token");
    await ShowSeatAPI.releaseLock("show-1", ["A1"], "lock-token");

    expect(axiosInstance.post).toHaveBeenNthCalledWith(
      1,
      "/shows/show-1/seats/refresh",
      { seats: ["A1"], lockToken: "lock-token" },
    );
    expect(axiosInstance.post).toHaveBeenNthCalledWith(
      2,
      "/shows/show-1/seats/release",
      { seats: ["A1"], lockToken: "lock-token" },
    );
  });
});
