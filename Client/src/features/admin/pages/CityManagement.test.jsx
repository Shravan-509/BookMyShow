import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import CityManagement from "./CityManagement";
import { renderWithProviders, setupStore } from "../../../test/renderWithProviders";

const cities = [
  {
    _id: "city-1",
    cityCode: "BLR",
    cityName: "Bengaluru",
    state: "Karnataka",
    country: "India",
    tier: "TIER_1",
    location: {
      type: "Point",
      coordinates: [77.5946, 12.9716],
    },
    isActive: true,
  },
  {
    _id: "city-2",
    cityName: "Mysuru",
    state: "Karnataka",
    country: "India",
    isActive: false,
  },
];

describe("CityManagement", () => {
  test("lists cities and requests city deactivation", () => {
    const store = setupStore({
      city: {
        cities,
        loading: false,
        error: null,
      },
    });
    const originalDispatch = store.dispatch;
    store.dispatch = vi.fn(originalDispatch);

    const { container } = renderWithProviders(<CityManagement />, { store });

    expect(screen.getByText("Bengaluru")).toBeInTheDocument();
    expect(screen.getByText("Mysuru")).toBeInTheDocument();
    expect(screen.getByText("BLR")).toBeInTheDocument();
    expect(screen.getByText("Tier 1")).toBeInTheDocument();
    expect(screen.getByText("77.5946, 12.9716")).toBeInTheDocument();

    fireEvent.click(container.querySelector(".ant-btn-dangerous"));

    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "city/deactivateCityRequest",
      payload: "city-1",
    }));
  });
});
