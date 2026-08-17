import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { SeatLayout } from "./SeatLayout";
import { renderWithProviders } from "../test/renderWithProviders";

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

    const bookedSeat = screen.getByRole("button", { name: "1" });
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

    await user.click(screen.getByRole("button", { name: "2" }));
    expect(onSeatSelect).toHaveBeenCalledWith("A2");

    rerender(
      <SeatLayout
        totalSeats={15}
        bookedSeats={["A1"]}
        selectedSeats={["A2"]}
        onSeatSelect={onSeatSelect}
      />,
    );

    expect(screen.getByRole("button", { name: "2" })).toHaveClass("ant-btn-primary");
  });
});
