import { render, screen } from "@testing-library/react";
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
});
