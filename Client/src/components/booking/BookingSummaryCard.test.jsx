import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import BookingSummaryCard from "./BookingSummaryCard";

const show = {
  movie: {
    movieName: "Dune",
    poster: "poster.jpg",
    duration: 166,
  },
  theatre: {
    name: "INOX",
  },
};

describe("BookingSummaryCard", () => {
  test("renders booking context, selected seats, and pricing", () => {
    render(
      <BookingSummaryCard
        show={show}
        screenName="Screen 1"
        formattedDate="Mon, 17 Aug, 2026"
        formattedTime="06:00 PM"
        selectedSeats={["A1", "A2"]}
        seatPricing={[
          { seatNumber: "A1", seatType: "STANDARD", seatTypeLabel: "Standard", price: 250 },
          { seatNumber: "A2", seatType: "PREMIUM", seatTypeLabel: "Premium", price: 325 },
        ]}
        ticketAmount={575}
        ctaDisabled={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "Your Booking" })).toBeInTheDocument();
    expect(screen.getByText("Dune")).toBeInTheDocument();
    expect(screen.getByText("INOX")).toBeInTheDocument();
    expect(screen.getByText(/Screen 1/)).toBeInTheDocument();
    expect(screen.getByText("A1, A2")).toBeInTheDocument();
    expect(screen.getByText("₹575.00")).toBeInTheDocument();
    expect(screen.getByText("Calculated at checkout")).toBeInTheDocument();
    expect(screen.getByText("Finalized at checkout")).toBeInTheDocument();
    expect(screen.getByText("Seats are confirmed after successful payment.")).toBeInTheDocument();
  });

  test("disables CTA with no selected seats and calls handler when enabled", async () => {
    const onCtaClick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <BookingSummaryCard
        show={show}
        selectedSeats={[]}
        ticketAmount={0}
        ctaDisabled
        onCtaClick={onCtaClick}
      />,
    );

    expect(screen.getByRole("button", { name: "Continue to Checkout" })).toBeDisabled();
    expect(screen.getByText("None")).toBeInTheDocument();

    rerender(
      <BookingSummaryCard
        show={show}
        selectedSeats={["B4"]}
        ticketAmount={250}
        ctaDisabled={false}
        onCtaClick={onCtaClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Continue to Checkout" }));

    expect(onCtaClick).toHaveBeenCalledTimes(1);
  });

  test("can render confirmation summary without a CTA", () => {
    render(
      <BookingSummaryCard
        show={show}
        screenName="Screen 1"
        formattedDate="Mon, 17 Aug, 2026"
        formattedTime="06:00 PM"
        selectedSeats={["A1", "A2"]}
        ticketAmount={575}
        showCta={false}
        showContextDetails={false}
        note="Enjoy the show."
      />,
    );

    const summary = screen.getByLabelText("Booking summary");
    expect(within(summary).getByRole("heading", { name: "Your Booking" })).toBeInTheDocument();
    expect(within(summary).queryByText("Theatre")).not.toBeInTheDocument();
    expect(within(summary).queryByText("Screen")).not.toBeInTheDocument();
    expect(within(summary).queryByText("Date & Time")).not.toBeInTheDocument();
    expect(within(summary).queryByText("INOX")).not.toBeInTheDocument();
    expect(within(summary).queryByText(/Screen 1/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue to Checkout" })).not.toBeInTheDocument();
    expect(screen.getByText("Enjoy the show.")).toBeInTheDocument();
  });
});
