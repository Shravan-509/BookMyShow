import { describe, expect, test, vi } from "vitest";
import { axiosInstance } from ".";
import { ShowSeatAPI } from "./showSeat";

vi.mock(".", () => ({
  axiosInstance: {
    get: vi.fn(),
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
});
