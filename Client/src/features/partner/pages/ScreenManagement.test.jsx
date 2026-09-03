import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import ScreenManagement from "./ScreenManagement";
import TheatreList from "./TheatreList";
import { renderWithProviders, setupStore } from "../../../test/renderWithProviders";

const theatre = {
  _id: "theatre-1",
  name: "Sree Rama Theatre",
  address: "Station Road, 530016",
  phone: 9876543210,
  email: "sreerama@example.com",
  isActive: true,
  city: { cityName: "Visakhapatnam", state: "Andhra Pradesh" },
};

const screens = [
  {
    _id: "screen-1",
    theatre: "theatre-1",
    name: "Screen 1",
    screenNumber: 1,
    capacity: 650,
    isActive: true,
  },
  {
    _id: "screen-2",
    theatre: "theatre-1",
    name: "Screen 2",
    screenNumber: 2,
    capacity: 250,
    isActive: false,
  },
];

const screenState = {
  loading: false,
  error: null,
  screensByTheatre: {
    "theatre-1": screens,
  },
};

describe("ScreenManagement", () => {
  test("renders theatre-specific screens and dispatches fetch", () => {
    const store = setupStore({ screen: screenState });
    store.dispatch = vi.fn();

    renderWithProviders(
      <ScreenManagement
        isScreenModalOpen
        setIsScreenModalOpen={vi.fn()}
        selectedTheatre={theatre}
        setSelectedTheatre={vi.fn()}
      />,
      { store }
    );

    expect(screen.getByText("Screen 1")).toBeInTheDocument();
    expect(screen.getByText("Screen 2")).toBeInTheDocument();
    expect(screen.getByText("650")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "screen/fetchScreensByTheatreRequest",
      payload: { theatreId: "theatre-1" },
    }));
  });

  test("Theatre table exposes a Screens action", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const store = setupStore({
      theatre: {
        theatre: [theatre],
        loading: false,
        error: null,
      },
      screen: screenState,
    });
    store.dispatch = vi.fn();

    renderWithProviders(<TheatreList />, { store });

    fireEvent.click(screen.getByRole("button", { name: /screens/i }));

    expect(screen.getByText("Screens - Sree Rama Theatre")).toBeInTheDocument();
  });
});
