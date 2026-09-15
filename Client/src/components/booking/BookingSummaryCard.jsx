import { CalendarOutlined, ClockCircleOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Typography } from "antd";
import { formatCurrency, groupSeatPricing } from "../../utils/ticketPricing";

const { Text, Title } = Typography;

const BookingSummaryCard = ({
  show,
  screenName = "",
  formattedDate = "",
  formattedTime = "",
  selectedSeats = [],
  seatPricing = [],
  ticketAmount = 0,
  convenienceFee = null,
  totalAmount = null,
  ctaLabel = "Continue to Checkout",
  ctaDisabled = true,
  onCtaClick,
}) => {
  const movie = show?.movie || {};
  const theatre = show?.theatre || {};
  const groupedSeats = groupSeatPricing(seatPricing);
  const hasSeats = selectedSeats.length > 0;

  return (
    <Card className="booking-summary-card" variant="borderless">
      <Title level={4} className="booking-summary-title">
        Your Booking
      </Title>

      <div className="booking-summary-movie">
        {movie.poster && (
          <img src={movie.poster} alt={`${movie.movieName || "Movie"} poster`} />
        )}
        <div>
          <Text strong>{movie.movieName || "Movie"}</Text>
          {show?.movie?.duration && (
            <Text type="secondary" className="booking-summary-small">
              {show.movie.duration} min
            </Text>
          )}
        </div>
      </div>

      <Divider />

      <div className="booking-summary-details">
        {theatre.name && (
          <div>
            <Text type="secondary">Theatre</Text>
            <Text strong>{theatre.name}</Text>
          </div>
        )}
        {screenName && (
          <div>
            <Text type="secondary">Screen</Text>
            <Text strong>
              <VideoCameraOutlined aria-hidden="true" /> {screenName}
            </Text>
          </div>
        )}
        {(formattedDate || formattedTime) && (
          <div>
            <Text type="secondary">Date & Time</Text>
            <Text strong>
              {formattedDate && <CalendarOutlined aria-hidden="true" />} {formattedDate}
              {formattedDate && formattedTime ? " | " : ""}
              {formattedTime && <ClockCircleOutlined aria-hidden="true" />} {formattedTime}
            </Text>
          </div>
        )}
      </div>

      <Divider />

      <div className="booking-summary-selected">
        <div className="booking-summary-row">
          <Text type="secondary">Selected Seats</Text>
          <Text strong>{hasSeats ? selectedSeats.join(", ") : "None"}</Text>
        </div>
        {groupedSeats.length > 0 && (
          <div className="booking-summary-seat-groups">
            {groupedSeats.map((group) => (
              <div key={`${group.seatType}-${group.price}`}>
                <Text>{group.seatTypeLabel}</Text>
                <Text type="secondary">{group.seats.join(", ")}</Text>
              </div>
            ))}
          </div>
        )}
      </div>

      <Divider />

      <div className="booking-summary-pricing">
        <div className="booking-summary-row">
          <Text>{selectedSeats.length} {selectedSeats.length === 1 ? "Ticket" : "Tickets"}</Text>
          <Text strong>{formatCurrency(ticketAmount)}</Text>
        </div>
        <div className="booking-summary-row">
          <Text type="secondary">Convenience Fee</Text>
          <Text type="secondary">
            {typeof convenienceFee === "number" ? formatCurrency(convenienceFee) : "Calculated at checkout"}
          </Text>
        </div>
        <div className="booking-summary-row booking-summary-total">
          <Text strong>Total Amount</Text>
          <Text strong>
            {typeof totalAmount === "number" ? formatCurrency(totalAmount) : "Finalized at checkout"}
          </Text>
        </div>
      </div>

      <Button
        type="primary"
        size="large"
        className="booking-summary-cta"
        disabled={ctaDisabled}
        onClick={onCtaClick}
      >
        {ctaLabel}
      </Button>

      <Text type="secondary" className="booking-summary-note">
        Seats are confirmed after successful payment.
      </Text>
    </Card>
  );
};

export default BookingSummaryCard;
