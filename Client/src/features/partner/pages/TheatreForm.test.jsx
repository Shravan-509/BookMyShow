import { screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import TheatreForm from "./TheatreForm";
import { renderWithProviders, setupStore } from "../../../test/renderWithProviders";

describe("TheatreForm", () => {
  test("renders city selection from active cities", () => {
    const store = setupStore({
      auth: {
        user: { id: "partner-1", role: "partner" },
        token: null,
        isAuthenticated: true,
        loading: false,
        checkingAuth: false,
        error: null,
      },
      city: {
        cities: [
          {
            _id: "city-1",
            cityName: "Bengaluru",
            state: "Karnataka",
            country: "India",
            isActive: true,
          },
        ],
        loading: false,
        error: null,
      },
    });
    const originalDispatch = store.dispatch;
    store.dispatch = vi.fn(originalDispatch);

    renderWithProviders(
      <TheatreForm
        isModalOpen
        setIsModalOpen={vi.fn()}
        formType="add"
        selectedTheatre={null}
        setSelectedTheatre={vi.fn()}
      />,
      { store }
    );

    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "city/fetchCitiesRequest",
    }));
  });
});
