import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import SeatManagement from "./SeatManagement";
import ScreenManagement from "./ScreenManagement";
import {
  countPreviewSeats,
  generateSequentialRows,
  getSequentialSeatPreview,
  numberToRowLabel,
  rowLabelToNumber,
} from "./seatManagementUtils";
import { renderWithProviders, setupStore } from "../../../test/renderWithProviders";

const theatre = {
  _id: "theatre-1",
  name: "Sree Rama Theatre",
  isActive: true,
};

const selectedScreen = {
  _id: "screen-1",
  theatre: "theatre-1",
  name: "Screen 1",
  screenNumber: 1,
  capacity: 4,
  isActive: true,
};

const seats = [
  {
    _id: "seat-1",
    screen: "screen-1",
    seatNumber: "A1",
    row: "A",
    column: 1,
    seatType: "STANDARD",
    isActive: true,
  },
  {
    _id: "seat-2",
    screen: "screen-1",
    seatNumber: "A2",
    row: "A",
    column: 2,
    seatType: "PREMIUM",
    isActive: false,
  },
];

const bookingState = {
  loading: false,
  error: null,
  validationResult: null,
  bookingData: null,
  userBookings: [],
  allBookings: [],
  theatreBookings: [],
  revenueData: null,
  razorpayOrder: null,
  isPaymentProcessing: false,
  paymentError: null,
};

const baseState = {
  booking: bookingState,
  seat: {
    loading: false,
    error: null,
    seatsByScreen: {
      "screen-1": seats,
    },
    summariesByScreen: {
      "screen-1": {
        capacity: 4,
        activeSeatCount: 1,
        remainingCapacity: 3,
        layoutStatus: "INCOMPLETE",
      },
    },
  },
};

const renderSeatManagement = ({ screenOverride = selectedScreen, stateOverride = {} } = {}) => {
  const store = setupStore({
    ...baseState,
    ...stateOverride,
  });
  store.dispatch = vi.fn();

  renderWithProviders(
    <SeatManagement
      isSeatModalOpen
      setIsSeatModalOpen={vi.fn()}
      selectedTheatre={theatre}
      selectedScreen={screenOverride}
      setSelectedScreen={vi.fn()}
    />,
    { store },
  );

  return store;
};

describe("seatManagementUtils sequential row helpers", () => {
  test("converts spreadsheet-style row labels in both directions", () => {
    expect(rowLabelToNumber("A")).toBe(1);
    expect(rowLabelToNumber("Z")).toBe(26);
    expect(rowLabelToNumber("AA")).toBe(27);
    expect(numberToRowLabel(1)).toBe("A");
    expect(numberToRowLabel(26)).toBe("Z");
    expect(numberToRowLabel(27)).toBe("AA");
  });

  test("generates row labels beyond Z", () => {
    expect(generateSequentialRows({ startingRow: "A", numberOfRows: 1, seatsPerRow: 1 })[0].row).toBe("A");
    expect(generateSequentialRows({ startingRow: "A", numberOfRows: 26, seatsPerRow: 1 }).map((row) => row.row).at(-1)).toBe("Z");
    expect(generateSequentialRows({ startingRow: "A", numberOfRows: 27, seatsPerRow: 1 }).map((row) => row.row).at(-1)).toBe("AA");
    expect(generateSequentialRows({ startingRow: "Y", numberOfRows: 5, seatsPerRow: 1 }).map((row) => row.row)).toEqual(["Y", "Z", "AA", "AB", "AC"]);
    expect(generateSequentialRows({ startingRow: "AA", numberOfRows: 3, seatsPerRow: 1 }).map((row) => row.row)).toEqual(["AA", "AB", "AC"]);
  });

  test("calculates large sequential and excluded-column previews", () => {
    expect(countPreviewSeats(generateSequentialRows({
      startingRow: "A",
      numberOfRows: 50,
      seatsPerRow: 30,
    }))).toBe(1500);

    expect(countPreviewSeats(generateSequentialRows({
      startingRow: "A",
      numberOfRows: 30,
      seatsPerRow: 20,
      excludedColumns: "10,11",
    }))).toBe(540);
  });

  test("reports invalid sequential input and capacity overflow", () => {
    expect(getSequentialSeatPreview({ startingRow: "A1", numberOfRows: 1, seatsPerRow: 10 })).toMatchObject({
      isValid: false,
    });
    expect(getSequentialSeatPreview({ startingRow: "A", numberOfRows: 0, seatsPerRow: 10 })).toMatchObject({
      isValid: false,
    });
    expect(getSequentialSeatPreview({ startingRow: "A", numberOfRows: 1, seatsPerRow: 0 })).toMatchObject({
      isValid: false,
    });
    expect(getSequentialSeatPreview({ startingRow: "A", numberOfRows: 1, seatsPerRow: 10, excludedColumns: "x" })).toMatchObject({
      isValid: false,
    });
    expect(getSequentialSeatPreview(
      { startingRow: "A", numberOfRows: 2, seatsPerRow: 10 },
      { activeSeatCount: 5, capacity: 20 },
    )).toMatchObject({
      isValid: true,
      exceedsCapacity: true,
      seatsToCreate: 20,
      afterCreation: 25,
    });
  });
});

describe("SeatManagement", () => {
  test("loads seats and shows capacity summary with layout status", () => {
    const store = renderSeatManagement();

    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "seat/fetchSeatsByScreenRequest",
      payload: { screenId: "screen-1" },
    }));
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("INCOMPLETE")).toBeInTheDocument();
    expect(screen.getByText("Configured Seats")).toBeInTheDocument();
  });

  test("creates a single Seat with derived seatNumber", async () => {
    const store = renderSeatManagement();

    fireEvent.click(screen.getByRole("button", { name: /add seat/i }));
    fireEvent.change(await screen.findByLabelText("Row"), { target: { value: "b" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Column" }), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /^submit$/i }));

    await waitFor(() => expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "seat/createSeatRequest",
      payload: expect.objectContaining({
        screenId: "screen-1",
        seat: expect.objectContaining({
          row: "B",
          column: 3,
          seatNumber: "B3",
          seatType: "STANDARD",
        }),
      }),
    })));
  }, 10000);

  test("edits and re-enables Seats", async () => {
    const store = renderSeatManagement();
    const disabledRow = screen.getByText("A2").closest("tr");

    fireEvent.click(within(disabledRow).getByRole("button", { name: "Edit A2" }));
    await screen.findByText("Edit Seat");
    fireEvent.click(screen.getByRole("button", { name: /^submit$/i }));

    await waitFor(() => expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "seat/updateSeatRequest",
      payload: expect.objectContaining({
        id: "seat-2",
        seat: expect.objectContaining({ seatType: "PREMIUM" }),
      }),
    })));

    fireEvent.click(within(disabledRow).getByRole("button", { name: "Enable A2" }));
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "seat/updateSeatRequest",
      payload: expect.objectContaining({
        id: "seat-2",
        seat: expect.objectContaining({ isActive: true }),
      }),
    }));
  }, 10000);

  test("disables active Seat after confirmation", async () => {
    const store = renderSeatManagement();
    const activeRow = screen.getByText("A1").closest("tr");

    fireEvent.click(within(activeRow).getAllByRole("button")[1]);
    fireEvent.click(await screen.findByText("Yes"));

    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "seat/disableSeatRequest",
      payload: { id: "seat-1", screenId: "screen-1" },
    }));
  });

  test("bulk preview counts excluded columns and prevents capacity overflow", async () => {
    const user = userEvent.setup();
    renderSeatManagement();

    expect(countPreviewSeats([
      { row: "A", startColumn: 1, endColumn: 4, excludedColumns: "2,3" },
    ])).toBe(2);

    await user.click(await screen.findByRole("button", { name: /bulk create seats/i }));
    expect(await screen.findByText("Seats to create: 10")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /^create seats$/i })).toBeDisabled());
  }, 15000);

  test("sequential mode previews 1500 seats and submits generated rows through the bulk API", async () => {
    const user = userEvent.setup();
    const largeScreen = { ...selectedScreen, capacity: 1500 };
    const store = renderSeatManagement({
      screenOverride: largeScreen,
      stateOverride: {
        seat: {
          loading: false,
          error: null,
          seatsByScreen: { "screen-1": [] },
          summariesByScreen: {
            "screen-1": {
              capacity: 1500,
              activeSeatCount: 0,
              remainingCapacity: 1500,
              layoutStatus: "INCOMPLETE",
            },
          },
        },
      },
    });

    await user.click(await screen.findByRole("button", { name: /bulk create seats/i }));
    await user.click(await screen.findByText("Sequential Rows"));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Number of Rows" }), { target: { value: "50" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Seats Per Row" }), { target: { value: "30" } });

    expect(await screen.findByText("Seats to create: 1500")).toBeInTheDocument();
    expect(screen.getByText(/Rows: A - AX/)).toBeInTheDocument();
    expect(screen.getByText(/Layout after creation: COMPLETE/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^create seats$/i }));

    await waitFor(() => expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "seat/bulkCreateSeatsRequest",
      payload: expect.objectContaining({
        screenId: "screen-1",
        rows: expect.arrayContaining([
          expect.objectContaining({ row: "A", startColumn: 1, endColumn: 30 }),
          expect.objectContaining({ row: "AX", startColumn: 1, endColumn: 30 }),
        ]),
      }),
    })));
    const bulkCall = store.dispatch.mock.calls.find(([action]) => action.type === "seat/bulkCreateSeatsRequest");
    expect(bulkCall[0].payload.rows).toHaveLength(50);
  }, 20000);

  test("sequential mode counts excluded columns and blocks capacity overflow", async () => {
    renderSeatManagement({
      stateOverride: {
        seat: {
          loading: false,
          error: null,
          seatsByScreen: { "screen-1": [] },
          summariesByScreen: {
            "screen-1": {
              capacity: 20,
              activeSeatCount: 0,
              remainingCapacity: 20,
              layoutStatus: "INCOMPLETE",
            },
          },
        },
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /bulk create seats/i }));
    fireEvent.click(screen.getByText("Sequential Rows"));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Number of Rows" }), { target: { value: "30" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Seats Per Row" }), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText("Excluded Columns"), { target: { value: "10,11" } });

    expect(await screen.findByText("Seats to create: 540")).toBeInTheDocument();
    expect(screen.getByText(/Excluded per row: 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^create seats$/i })).toBeDisabled();
  }, 20000);

  test("ScreenManagement opens Seat Management from a Screen row", async () => {
    const user = userEvent.setup();
    const store = setupStore({
      ...baseState,
      screen: {
        loading: false,
        error: null,
        screensByTheatre: {
          "theatre-1": [selectedScreen],
        },
      },
    });
    store.dispatch = vi.fn();

    renderWithProviders(
      <ScreenManagement
        isScreenModalOpen
        setIsScreenModalOpen={vi.fn()}
        selectedTheatre={theatre}
        setSelectedTheatre={vi.fn()}
      />,
      { store },
    );

    const screenRow = (await screen.findByText("Screen 1")).closest("tr");
    const manageSeatsButton = within(screenRow).getByRole("button", { name: /manage seats/i });
    await user.click(manageSeatsButton);

    expect(await screen.findByText("Seats - Screen 1")).toBeInTheDocument();
  }, 15000);
});
