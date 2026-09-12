import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderWithProviders, setupStore } from "../../../test/renderWithProviders";
import {
  getShowByIdSuccess,
} from "../../../redux/slices/showSlice";
import {
  clearShowSeats,
  fetchShowSeatsFailure,
  fetchShowSeatsRequest,
  fetchShowSeatsSuccess,
} from "../../../redux/slices/showSeatSlice";
import Booking from "./SeatSelection";

const routeState = vi.hoisted(() => ({
  showId: "show-1",
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: routeState.showId }),
  };
});

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      name: "Test User",
      email: "test@example.com",
      phone: "9876543210",
    },
  }),
}));

vi.mock("../../../components/SeatRecommendation", () => ({
  default: () => <div data-testid="seat-recommendation" />,
}));

vi.mock("../../../components/SeatLayout", () => ({
  SeatLayout: ({ selectedSeats, onSeatSelect, layoutStatus, showSeats = [], getSeatPrice }) => (
    <div data-testid={layoutStatus === "INITIALIZED" ? "physical-seat-layout" : "legacy-seat-layout"}>
      {(layoutStatus === "INITIALIZED" ? showSeats : [{ seatNumber: "A1" }, { seatNumber: "A2" }]).map((seat) => (
        <button key={seat.seatNumber} type="button" onClick={() => onSeatSelect(seat.seatNumber)}>
          Seat {seat.seatNumber}
        </button>
      ))}
      {layoutStatus === "INITIALIZED" && (
        <span data-testid="premium-seat-price">{getSeatPrice?.("PREMIUM")}</span>
      )}
      <span data-testid="selected-seat-labels">{selectedSeats.join(",")}</span>
    </div>
  ),
}));

vi.mock("./Checkout", () => ({
  default: ({ seats, show, showSeats = [] }) => (
    <div>
      <div data-testid="checkout-seats">Checkout seats: {seats.join(",")}</div>
      <div data-testid="checkout-show-seats">{showSeats.map((seat) => seat.seatNumber).join(",")}</div>
      {show?.screen?.name && <div data-testid="checkout-screen">{show.screen.name}</div>}
    </div>
  ),
}));

vi.mock("../../../utils/notificationUtils", () => ({
  notify: vi.fn(),
}));

const screenAwareShow = (overrides = {}) => ({
  _id: overrides._id || "show-1",
  movie: { _id: "movie-1", movieName: "Dune" },
  theatre: { _id: "theatre-1", name: "INOX" },
  screen: {
    _id: overrides.screenId || "screen-1",
    name: "Screen 1",
    screenNumber: 1,
    capacity: 2,
  },
  date: "2026-08-17T00:00:00.000Z",
  time: "18:00",
  ticketPrice: 250,
  ticketPricing: {
    STANDARD: 250,
    PREMIUM: 325,
  },
  totalSeats: 2,
  bookedSeats: [],
  ...overrides,
});

const legacyShow = () => ({
  ...screenAwareShow({ _id: "show-legacy", screen: null, totalSeats: 30 }),
});

const initializedInventory = {
  showId: "show-1",
  screenId: "screen-1",
  screenName: "Screen 1",
  screenNumber: 1,
  capacity: 2,
  layoutStatus: "INITIALIZED",
  seats: [
    { showSeatId: "ss-a1", seatId: "seat-a1", seatNumber: "A1", row: "A", column: 1, seatType: "STANDARD", status: "AVAILABLE" },
    { showSeatId: "ss-a2", seatId: "seat-a2", seatNumber: "A2", row: "A", column: 2, seatType: "PREMIUM", status: "AVAILABLE" },
  ],
};

const renderSeatSelection = (selectedShow, showSeatState = {}) => {
  const store = setupStore({
    show: {
      loading: false,
      error: null,
      show: [],
      selectedShow,
      success: false,
    },
    showSeat: {
      inventory: null,
      loading: false,
      error: null,
      ...showSeatState,
    },
  });
  const dispatchSpy = vi.spyOn(store, "dispatch");

  const rendered = renderWithProviders(<Booking />, { store });

  act(() => {
    store.dispatch(getShowByIdSuccess(selectedShow));
  });

  return {
    store,
    dispatchSpy,
    user: userEvent.setup(),
    ...rendered,
  };
};

describe("SeatSelection ShowSeat integration", () => {
  beforeEach(() => {
    routeState.showId = "show-1";
  });

  test("loading screen-aware inventory does not render legacy synthetic seats", async () => {
    const { dispatchSpy } = renderSeatSelection(screenAwareShow());

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(fetchShowSeatsRequest({ showId: "show-1" }));
    });

    const fetchActions = dispatchSpy.mock.calls
      .map(([action]) => action)
      .filter((action) => action.type === fetchShowSeatsRequest.type);

    expect(fetchActions).toHaveLength(1);
    expect(screen.queryByTestId("legacy-seat-layout")).not.toBeInTheDocument();
    expect(screen.getByText("Loading seat layout...")).toBeInTheDocument();
  });

  test("initialized inventory renders physical SeatLayout", async () => {
    const { store } = renderSeatSelection(screenAwareShow());

    act(() => {
      store.dispatch(fetchShowSeatsSuccess(initializedInventory));
    });

    expect(await screen.findByTestId("physical-seat-layout")).toBeInTheDocument();
    expect(screen.getByTestId("premium-seat-price")).toHaveTextContent("325");
    expect(screen.queryByTestId("legacy-seat-layout")).not.toBeInTheDocument();
  });

  test("shows booking Screen context and keeps the existing blue direction indicator", async () => {
    const { store } = renderSeatSelection(screenAwareShow());

    act(() => {
      store.dispatch(fetchShowSeatsSuccess(initializedInventory));
    });

    expect(await screen.findByText("INOX")).toBeInTheDocument();
    expect(screen.getAllByText("Screen 1").length).toBeGreaterThan(0);
    expect(screen.getByText("All eyes this way please!")).toBeInTheDocument();
    expect(screen.queryByText(/^SCREEN$/)).not.toBeInTheDocument();
  });

  test("inventory error blocks seat selection for screen-aware Shows", async () => {
    const { store } = renderSeatSelection(screenAwareShow());

    act(() => {
      store.dispatch(fetchShowSeatsFailure("ShowSeat inventory is not ready for this show"));
    });

    expect(await screen.findByText("Seat layout unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("legacy-seat-layout")).not.toBeInTheDocument();
    expect(screen.queryByTestId("physical-seat-layout")).not.toBeInTheDocument();
  });

  test("legacy no-screen Show clears inventory and does not require ShowSeat data", async () => {
    routeState.showId = "show-legacy";
    const { dispatchSpy } = renderSeatSelection(legacyShow());

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(clearShowSeats());
    });

    const fetchActions = dispatchSpy.mock.calls
      .map(([action]) => action)
      .filter((action) => action.type === fetchShowSeatsRequest.type);

    expect(fetchActions).toHaveLength(0);
    expect(screen.getByTestId("legacy-seat-layout")).toBeInTheDocument();
  });

  test("showId change clears stale inventory and refetches for the new screen-aware Show", async () => {
    const { dispatchSpy, store, rerender } = renderSeatSelection(screenAwareShow());

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(fetchShowSeatsRequest({ showId: "show-1" }));
    });

    store.dispatch(fetchShowSeatsSuccess({
      showId: "show-1",
      layoutStatus: "INITIALIZED",
      seats: [],
    }));

    routeState.showId = "show-2";
    rerender(<Booking />);
    store.dispatch(getShowByIdSuccess(screenAwareShow({ _id: "show-2", screenId: "screen-2" })));

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(fetchShowSeatsRequest({ showId: "show-2" }));
    });

    const clearActions = dispatchSpy.mock.calls
      .map(([action]) => action)
      .filter((action) => action.type === clearShowSeats.type);

    expect(clearActions.length).toBeGreaterThan(0);
  });

  test("selected seats remain string labels and are passed unchanged to Checkout", async () => {
    const { user, store } = renderSeatSelection(screenAwareShow());

    act(() => {
      store.dispatch(fetchShowSeatsSuccess(initializedInventory));
    });

    await user.click(screen.getByRole("button", { name: "Seat A1" }));
    await user.click(screen.getByRole("button", { name: "Seat A2" }));

    expect(screen.getByTestId("selected-seat-labels")).toHaveTextContent("A1,A2");
    expect(screen.getByText("Standard × 1: ₹250.00")).toBeInTheDocument();
    expect(screen.getByText("Premium × 1: ₹325.00")).toBeInTheDocument();
    expect(screen.getByText("Subtotal: ₹575.00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /proceed to pay/i }));

    expect(await screen.findByTestId("checkout-seats")).toHaveTextContent("Checkout seats: A1,A2");
    expect(screen.getByTestId("checkout-show-seats")).toHaveTextContent("A1,A2");
    expect(screen.getByTestId("checkout-screen")).toHaveTextContent("Screen 1");
  });
});
