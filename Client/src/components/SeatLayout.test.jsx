import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { SeatLayout } from "./SeatLayout";
import { renderWithProviders } from "../test/renderWithProviders";
import {
  getPhysicalLayoutMetrics,
  getReadableDefaultTransform,
  groupPhysicalSeatsByRow,
  SHOWSEAT_LAYOUT_STATUS,
} from "./seatLayoutUtils";

const physicalSeats = [
  {
    showSeatId: "ss-a1",
    seatId: "seat-a1",
    seatNumber: "A1",
    row: "A",
    column: 1,
    seatType: "STANDARD",
    status: "AVAILABLE",
  },
  {
    showSeatId: "ss-a2",
    seatId: "seat-a2",
    seatNumber: "A2",
    row: "A",
    column: 2,
    seatType: "PREMIUM",
    status: "BOOKED",
  },
  {
    showSeatId: "ss-b8",
    seatId: "seat-b8",
    seatNumber: "B8",
    row: "B",
    column: 8,
    seatType: "STANDARD",
    status: "AVAILABLE",
  },
  {
    showSeatId: "ss-b11",
    seatId: "seat-b11",
    seatNumber: "B11",
    row: "B",
    column: 11,
    seatType: "RECLINER",
    status: "AVAILABLE",
  },
  {
    showSeatId: "ss-aa1",
    seatId: "seat-aa1",
    seatNumber: "AA1",
    row: "AA",
    column: 1,
    seatType: "STANDARD",
    status: "AVAILABLE",
  },
];

const rowLabel = (index) => {
  let value = index + 1;
  let label = "";

  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label;
};

const buildPhysicalSeats = ({ count, columns = 30, bookedIndexes = [] }) => (
  Array.from({ length: count }, (_, index) => {
    const rowIndex = Math.floor(index / columns);
    const column = (index % columns) + 1;
    const row = rowLabel(rowIndex);
    return {
      showSeatId: `ss-${index}`,
      seatId: `seat-${index}`,
      seatNumber: `${row}${column}`,
      row,
      column,
      seatType: index % 3 === 0 ? "RECLINER" : index % 2 === 0 ? "PREMIUM" : "STANDARD",
      status: bookedIndexes.includes(index) ? "BOOKED" : "AVAILABLE",
    };
  })
);

describe("SeatLayout", () => {
  test("does not allow booked seats to be selected", async () => {
    const onSeatSelect = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SeatLayout
        totalSeats={15}
        bookedSeats={["A1"]}
        selectedSeats={[]}
        onSeatSelect={onSeatSelect}
      />,
    );

    const bookedSeat = screen.getByRole("button", { name: "Seat A1, Standard, Booked" });
    expect(bookedSeat).toBeDisabled();

    await user.click(bookedSeat);

    expect(onSeatSelect).not.toHaveBeenCalled();
  });

  test("allows available seats to be selected and reflects selected state", async () => {
    const onSeatSelect = vi.fn();
    const user = userEvent.setup();

    const { rerender } = renderWithProviders(
      <SeatLayout
        totalSeats={15}
        bookedSeats={["A1"]}
        selectedSeats={[]}
        onSeatSelect={onSeatSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seat A2, Standard, Available" }));
    expect(onSeatSelect).toHaveBeenCalledWith("A2");

    rerender(
      <SeatLayout
        totalSeats={15}
        bookedSeats={["A1"]}
        selectedSeats={["A2"]}
        onSeatSelect={onSeatSelect}
      />,
    );

    expect(screen.getByRole("button", { name: "Seat A2, Standard, Selected" })).toHaveClass("ant-btn-primary");
  });

  test("renders actual physical ShowSeat rows, labels, seat types, and missing-column gaps", () => {
    renderWithProviders(
      <SeatLayout
        totalSeats={physicalSeats.length}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={physicalSeats}
        getSeatPrice={(seatType) => ({ STANDARD: 200, PREMIUM: 300, RECLINER: 500 }[seatType])}
      />,
    );

    expect(screen.getByRole("button", { name: "Seat A1, Standard, Available" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seat A2, Premium, Booked" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Seat B11, Recliner, Available" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seat AA1, Standard, Available" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Seat B9,/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Seat B10,/ })).not.toBeInTheDocument();
    expect(screen.getByTestId("seat-gap-B-9")).toBeInTheDocument();
    expect(screen.getByTestId("seat-gap-B-10")).toBeInTheDocument();
    expect(screen.getByText("Standard ₹200")).toBeInTheDocument();
    expect(screen.getByText("Premium ₹300")).toBeInTheDocument();
    expect(screen.getByText("Recliner ₹500")).toBeInTheDocument();
  });

  test("small physical layout remains centered and renderable", async () => {
    renderWithProviders(
      <SeatLayout
        totalSeats={physicalSeats.length}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={physicalSeats}
      />,
    );

    const content = screen.getByTestId("physical-seat-map-content");
    expect(screen.queryByTestId("physical-seat-stage")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Screen$/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("physical-seat-rows")).toBeInTheDocument();
    await waitFor(() => expect(content.style.transform).toContain("scale(1)"));
    expect(content.style.transform).toContain("translate(");
  });

  test("selects and toggles physical seats using seatNumber string values", async () => {
    const onSeatSelect = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <SeatLayout
        totalSeats={physicalSeats.length}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={onSeatSelect}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={physicalSeats}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seat B11, Recliner, Available" }));
    expect(onSeatSelect).toHaveBeenCalledWith("B11");

    rerender(
      <SeatLayout
        totalSeats={physicalSeats.length}
        bookedSeats={[]}
        selectedSeats={["B11"]}
        onSeatSelect={onSeatSelect}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={physicalSeats}
      />,
    );

    expect(screen.getByRole("button", { name: "Seat B11, Recliner, Selected" })).toHaveAttribute("aria-pressed", "true");
  });

  test("large physical layout uses readable seat size and natural content dimensions", () => {
    const largeLayout = buildPhysicalSeats({ count: 1500, columns: 30 });

    renderWithProviders(
      <SeatLayout
        totalSeats={1500}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={largeLayout}
      />,
    );

    const content = screen.getByTestId("physical-seat-map-content");
    const firstSeat = screen.getByTestId("seat-A1");
    expect(Number.parseInt(firstSeat.style.width, 10)).toBeGreaterThanOrEqual(36);
    expect(Number.parseInt(firstSeat.style.height, 10)).toBeGreaterThanOrEqual(36);
    expect(Number.parseInt(content.style.width, 10)).toBeGreaterThan(1200);
    expect(screen.queryByTestId("physical-seat-stage")).not.toBeInTheDocument();
  });

  test("large physical layout supports pan, zoom, and readable reset", async () => {
    const largeLayout = buildPhysicalSeats({ count: 300, columns: 30 });

    renderWithProviders(
      <SeatLayout
        totalSeats={1000}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={largeLayout}
      />,
    );

    const content = screen.getByTestId("physical-seat-map-content");
    const viewport = content.parentElement;

    await waitFor(() => expect(content.style.transform).toContain("scale(1)"));
    const defaultTransform = content.style.transform;

    fireEvent.mouseDown(viewport, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(viewport, { clientX: -120, clientY: -80 });
    fireEvent.mouseUp(viewport);

    await waitFor(() => expect(content.style.transform).not.toBe(defaultTransform));

    fireEvent.click(screen.getByTestId("seat-map-zoom-in"));
    await waitFor(() => expect(content.style.transform).toContain("scale(1.2)"));

    fireEvent.click(screen.getByTestId("seat-map-zoom-out"));
    fireEvent.click(screen.getByTestId("seat-map-zoom-out"));
    await waitFor(() => expect(content.style.transform).toContain("scale(0.8)"));

    fireEvent.click(screen.getByTestId("seat-map-reset"));
    await waitFor(() => expect(content.style.transform).toBe(defaultTransform));
  });

  test("multiple zoom operations clamp at physical minimum and maximum", async () => {
    const largeLayout = buildPhysicalSeats({ count: 500, columns: 30 });

    renderWithProviders(
      <SeatLayout
        totalSeats={500}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={largeLayout}
      />,
    );

    const content = screen.getByTestId("physical-seat-map-content");

    Array.from({ length: 6 }).forEach(() => {
      fireEvent.click(screen.getByTestId("seat-map-zoom-out"));
    });
    await waitFor(() => expect(content.style.transform).toContain("scale(0.55)"));

    Array.from({ length: 12 }).forEach(() => {
      fireEvent.click(screen.getByTestId("seat-map-zoom-in"));
    });
    await waitFor(() => expect(content.style.transform).toContain("scale(2)"));
  });

  test("physical pan is bounded and does not select a seat while dragging empty canvas", async () => {
    const onSeatSelect = vi.fn();
    const largeLayout = buildPhysicalSeats({ count: 500, columns: 30 });

    renderWithProviders(
      <SeatLayout
        totalSeats={500}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={onSeatSelect}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={largeLayout}
      />,
    );

    const content = screen.getByTestId("physical-seat-map-content");
    const viewport = content.parentElement;

    fireEvent.mouseDown(viewport, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(viewport, { clientX: -10000, clientY: -10000 });
    fireEvent.mouseUp(viewport);

    await waitFor(() => {
      const match = content.style.transform.match(/translate\((-?\d+(?:\.\d+)?)px, (-?\d+(?:\.\d+)?)px\)/);
      expect(match).not.toBeNull();
      expect(Number(match[1])).toBeGreaterThan(-600);
      expect(Number(match[2])).toBeGreaterThan(-600);
    });
    expect(onSeatSelect).not.toHaveBeenCalled();

    fireEvent.mouseDown(viewport, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(viewport, { clientX: 10000, clientY: 10000 });
    fireEvent.mouseUp(viewport);

    await waitFor(() => {
      const match = content.style.transform.match(/translate\((-?\d+(?:\.\d+)?)px, (-?\d+(?:\.\d+)?)px\)/);
      expect(Number(match[1])).toBeLessThanOrEqual(32);
      expect(Number(match[2])).toBeLessThanOrEqual(32);
    });
  });

  test("clicking a physical seat selects it without starting a pan", async () => {
    const onSeatSelect = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SeatLayout
        totalSeats={physicalSeats.length}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={onSeatSelect}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={physicalSeats}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seat B11, Recliner, Available" }));

    expect(onSeatSelect).toHaveBeenCalledWith("B11");
  });

  test("physical sizing utilities preserve missing-column width and readable minimum zoom", () => {
    const groupedRows = groupPhysicalSeatsByRow(physicalSeats);
    const metrics = getPhysicalLayoutMetrics(groupedRows);
    const transform = getReadableDefaultTransform(metrics, { width: 360, height: 300 });

    expect(metrics.columnCount).toBe(11);
    expect(metrics.seatAreaWidth).toBe(520);
    expect(metrics.width).toBe(604);
    expect(transform.scale).toBe(0.9);
  });

  test.each([
    [500],
    [1000],
    [1500],
  ])("renders a %i-seat physical layout without crashing", (seatCount) => {
    const largeLayout = buildPhysicalSeats({ count: seatCount, columns: 30 });

    renderWithProviders(
      <SeatLayout
        totalSeats={seatCount}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={largeLayout}
      />,
    );

    expect(screen.getByTestId("seat-A1")).toBeInTheDocument();
    expect(screen.getByTestId("physical-seat-map-content")).toBeInTheDocument();
  }, 15000);

  test("row labels beyond Z remain supported", () => {
    const largeLayout = buildPhysicalSeats({ count: 900, columns: 30 });

    renderWithProviders(
      <SeatLayout
        totalSeats={900}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={largeLayout}
      />,
    );

    expect(screen.getByTestId("seat-AA1")).toBeInTheDocument();
    expect(screen.getByTestId("seat-AD30")).toBeInTheDocument();
  });

  test("booked physical seats remain disabled in large layouts", async () => {
    const onSeatSelect = vi.fn();
    const user = userEvent.setup();
    const largeLayout = buildPhysicalSeats({ count: 500, columns: 25, bookedIndexes: [124] });

    renderWithProviders(
      <SeatLayout
        totalSeats={500}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={onSeatSelect}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={largeLayout}
      />,
    );

    const bookedSeat = screen.getByTestId("seat-E25");
    expect(bookedSeat).toBeDisabled();

    await user.click(bookedSeat);

    expect(onSeatSelect).not.toHaveBeenCalled();
  });

  test("renders a 1500-seat physical layout without duplicate key warnings", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const largeLayout = buildPhysicalSeats({ count: 1500, columns: 30 });

    renderWithProviders(
      <SeatLayout
        totalSeats={1500}
        bookedSeats={[]}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
        layoutStatus={SHOWSEAT_LAYOUT_STATUS.INITIALIZED}
        showSeats={largeLayout}
      />,
    );

    expect(screen.getByTestId("seat-A1")).toBeInTheDocument();
    expect(screen.getByTestId("seat-AX30")).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining("Encountered two children with the same key"));
    consoleErrorSpy.mockRestore();
  }, 15000);
});
