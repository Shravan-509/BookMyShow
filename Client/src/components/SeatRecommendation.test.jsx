import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import SeatRecommendation from "./SeatRecommendation";

describe("SeatRecommendation physical inventory mode", () => {
  test("recommends only real adjacent available ShowSeat labels", async () => {
    const onSeatSelect = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SeatRecommendation
        totalSeats={20}
        bookedSeats={[]}
        availableSeats={[
          { showSeatId: "ss-b8", seatNumber: "B8", row: "B", column: 8, status: "AVAILABLE" },
          { showSeatId: "ss-b11", seatNumber: "B11", row: "B", column: 11, status: "AVAILABLE" },
          { showSeatId: "ss-b12", seatNumber: "B12", row: "B", column: 12, status: "AVAILABLE" },
        ]}
        selectedSeats={[]}
        onSeatSelect={onSeatSelect}
        groupSize={2}
        preferences={{ preferCenter: true }}
      />,
    );

    expect(screen.getByText(/B11, B12/)).toBeInTheDocument();
    expect(screen.queryByText(/B8, B11/)).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Select" })[0]);

    expect(onSeatSelect).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ seatId: "B11" }),
      expect.objectContaining({ seatId: "B12" }),
    ]));
  });
});
