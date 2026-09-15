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
import { notify } from "../../../utils/notificationUtils";
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
  default: ({ groupSize, onSeatSelect }) => (
    <div data-testid="seat-recommendation" data-group-size={groupSize}>
      <button
        type="button"
        onClick={() => onSeatSelect(
          Array.from({ length: groupSize }, (_, index) => ({ seatId: `R${index + 1}` })),
        )}
      >
        Use recommendation
      </button>
    </div>
  ),
}));

vi.mock("../../../components/SeatLayout", () => ({
  SeatLayout: ({ selectedSeats, onSeatSelect, layoutStatus, showSeats = [], getSeatPrice }) => (
    <div data-testid={layoutStatus === "INITIALIZED" ? "physical-seat-layout" : "legacy-seat-layout"}>
      {(layoutStatus === "INITIALIZED" ? showSeats : [{ seatNumber: "A1" }, { seatNumber: "A2" }]).map((seat) => (
        <button
          key={seat.seatNumber}
          type="button"
          disabled={seat.status === "BOOKED"}
          onClick={() => onSeatSelect(seat.seatNumber)}
        >
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
  default: ({ seats, show, showSeats = [], handlePreviousStep }) => (
    <div>
      <div data-testid="checkout-seats">Checkout seats: {seats.join(",")}</div>
      <div data-testid="checkout-show-seats">{showSeats.map((seat) => seat.seatNumber).join(",")}</div>
      {show?.screen?.name && <div data-testid="checkout-screen">{show.screen.name}</div>}
      <button type="button" onClick={handlePreviousStep}>Edit Seats</button>
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
    capacity: 6,
  },
  date: "2026-08-17T00:00:00.000Z",
  time: "18:00",
  ticketPrice: 250,
  ticketPricing: {
    STANDARD: 250,
    PREMIUM: 325,
  },
  totalSeats: 6,
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
  capacity: 6,
  layoutStatus: "INITIALIZED",
  seats: [
    { showSeatId: "ss-a1", seatId: "seat-a1", seatNumber: "A1", row: "A", column: 1, seatType: "STANDARD", status: "AVAILABLE" },
    { showSeatId: "ss-a2", seatId: "seat-a2", seatNumber: "A2", row: "A", column: 2, seatType: "PREMIUM", status: "AVAILABLE" },
    { showSeatId: "ss-a3", seatId: "seat-a3", seatNumber: "A3", row: "A", column: 3, seatType: "STANDARD", status: "AVAILABLE" },
    { showSeatId: "ss-a5", seatId: "seat-a5", seatNumber: "A5", row: "A", column: 5, seatType: "RECLINER", status: "AVAILABLE" },
    { showSeatId: "ss-a6", seatId: "seat-a6", seatNumber: "A6", row: "A", column: 6, seatType: "STANDARD", status: "BOOKED" },
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

    expect((await screen.findAllByText("INOX")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Screen 1").length).toBeGreaterThan(0);
    expect(screen.getByText("Mon, 17 Aug, 2026").closest(".show-context-datetime")).toHaveTextContent("06:00 PM");
    expect(screen.getByText("All eyes this way please!")).toBeInTheDocument();
    expect(screen.queryByText(/^SCREEN$/)).not.toBeInTheDocument();
  });

  test("ticket count controls constrain manual seat selection without changing selected seat labels", async () => {
    const { user, store } = renderSeatSelection(screenAwareShow());

    act(() => {
      store.dispatch(fetchShowSeatsSuccess(initializedInventory));
    });

    expect(screen.getByLabelText("Number of tickets")).toHaveTextContent("2");
    expect(screen.getByTestId("seat-recommendation")).toHaveAttribute("data-group-size", "2");

    await user.click(screen.getByLabelText("Increase ticket count"));
    await user.click(screen.getByLabelText("Increase ticket count"));
    await user.click(screen.getByLabelText("Increase ticket count"));
    await user.click(screen.getByLabelText("Increase ticket count"));

    expect(screen.getByLabelText("Number of tickets")).toHaveTextContent("5");
    expect(screen.getByLabelText("Increase ticket count")).toBeDisabled();
    expect(screen.getByTestId("seat-recommendation")).toHaveAttribute("data-group-size", "5");

    await user.click(screen.getByRole("button", { name: "Seat A1" }));
    await user.click(screen.getByRole("button", { name: "Seat A2" }));
    await user.click(screen.getByRole("button", { name: "Seat A3" }));
    await user.click(screen.getByRole("button", { name: "Seat A5" }));

    expect(screen.getByTestId("selected-seat-labels")).toHaveTextContent("A1,A2,A3,A5");

    await user.click(screen.getByLabelText("Decrease ticket count"));
    expect(screen.getByLabelText("Number of tickets")).toHaveTextContent("4");
    expect(screen.getByLabelText("Decrease ticket count")).toBeDisabled();
  });

  test("default ticket count blocks extra seats and leaves booked seats disabled", async () => {
    const { user, store } = renderSeatSelection(screenAwareShow());

    act(() => {
      store.dispatch(fetchShowSeatsSuccess(initializedInventory));
    });

    expect(screen.getByRole("button", { name: "Seat A6" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Seat A1" }));
    await user.click(screen.getByRole("button", { name: "Seat A2" }));
    await user.click(screen.getByRole("button", { name: "Seat A3" }));

    expect(screen.getByTestId("selected-seat-labels")).toHaveTextContent("A1,A2");
    expect(notify).toHaveBeenCalledWith("warning", "You've selected 2 of 2 seats.");
  });

  test("recommendations respect desired ticket count and keep selectedSeats as strings", async () => {
    const { user, store } = renderSeatSelection(screenAwareShow());

    act(() => {
      store.dispatch(fetchShowSeatsSuccess(initializedInventory));
    });

    await user.click(screen.getByLabelText("Increase ticket count"));
    await user.click(screen.getByRole("button", { name: "Use recommendation" }));

    expect(screen.getByTestId("seat-recommendation")).toHaveAttribute("data-group-size", "3");
    expect(screen.getByTestId("selected-seat-labels")).toHaveTextContent("R1,R2,R3");
  });

  test("legend stays singular outside the map and expanded view preserves selected seats", async () => {
    const { user, store } = renderSeatSelection(screenAwareShow());

    act(() => {
      store.dispatch(fetchShowSeatsSuccess(initializedInventory));
    });

    await user.click(screen.getByRole("button", { name: "Seat A1" }));

    expect(screen.getAllByLabelText("Seat legend")).toHaveLength(1);
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("Selected")).toBeInTheDocument();
    expect(screen.getByText("Booked")).toBeInTheDocument();
    expect(screen.getByText("Standard ₹250.00")).toBeInTheDocument();
    expect(screen.getByText("Premium ₹325.00")).toBeInTheDocument();
    expect(screen.getByText("Recliner ₹250.00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand seat map" }));

    expect(screen.getByRole("dialog", { name: "Expanded seat map" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("Seat legend")).toHaveLength(1);
    expect(screen.getByTestId("physical-seat-layout")).toBeInTheDocument();
    expect(screen.getByTestId("selected-seat-labels")).toHaveTextContent("A1");

    await user.click(screen.getByRole("button", { name: "Collapse seat map" }));

    expect(screen.queryByRole("dialog", { name: "Expanded seat map" })).not.toBeInTheDocument();
    expect(screen.getByTestId("selected-seat-labels")).toHaveTextContent("A1");
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
    expect(screen.getByText("2 Tickets")).toBeInTheDocument();
    expect(screen.getByText("₹575.00")).toBeInTheDocument();
    expect(screen.queryByText("Subtotal: ₹575.00")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Continue to Checkout" })).toHaveLength(1);

    await user.click(screen.getAllByRole("button", { name: "Continue to Checkout" })[0]);

    expect(screen.getByText("Showtime").closest(".booking-progress-step")).toHaveClass("complete");
    expect(screen.getByText("Seats").closest(".booking-progress-step")).toHaveClass("complete");
    expect(screen.getByText("Checkout").closest(".booking-progress-step")).toHaveClass("active");
    expect(screen.getByText("Confirmation").closest(".booking-progress-step")).toHaveClass("upcoming");
    expect(await screen.findByTestId("checkout-seats")).toHaveTextContent("Checkout seats: A1,A2");
    expect(screen.getByTestId("checkout-show-seats")).toHaveTextContent("A1,A2");
    expect(screen.getByTestId("checkout-screen")).toHaveTextContent("Screen 1");

    await user.click(screen.getByRole("button", { name: "Edit Seats" }));
    expect(screen.getByTestId("selected-seat-labels")).toHaveTextContent("A1,A2");
  });
});
