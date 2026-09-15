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
  feeBreakdown = [],
  ctaLabel = "Continue to Checkout",
  ctaDisabled = true,
  ctaLoading = false,
  ctaAriaLabel = "",
  onCtaClick,
  showCta = true,
  showContextDetails = true,
  note = "Seats are confirmed after successful payment.",
}) => {
  const movie = show?.movie || {};
  const theatre = show?.theatre || {};
  const groupedSeats = groupSeatPricing(seatPricing);
  const hasSeats = selectedSeats.length > 0;
  const hasContextDetails = showContextDetails && (
    theatre.name || screenName || formattedDate || formattedTime
  );

  return (
    <Card className="booking-summary-card" variant="borderless" aria-label="Booking summary">
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

      {hasContextDetails && (
        <>
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
        </>
      )}

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
                <span>
                  <Text>{group.seatTypeLabel}</Text>
                  <Text type="secondary">{group.seats.join(", ")}</Text>
                </span>
                <span>
                  <Text type="secondary">{group.count} × {formatCurrency(group.price)}</Text>
                  <Text strong>{formatCurrency(group.total)}</Text>
                </span>
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
        {feeBreakdown.length > 0 && (
          <div className="booking-summary-fee-breakdown">
            {feeBreakdown.map((item) => (
              <div className="booking-summary-row" key={item.label}>
                <Text type="secondary">{item.label}</Text>
                <Text type="secondary">{formatCurrency(item.amount)}</Text>
              </div>
            ))}
          </div>
        )}
        <div className="booking-summary-row booking-summary-total">
          <Text strong>Total Amount</Text>
          <Text strong>
            {typeof totalAmount === "number" ? formatCurrency(totalAmount) : "Finalized at checkout"}
          </Text>
        </div>
      </div>

      {showCta && (
        <Button
          type="primary"
          size="large"
          className="booking-summary-cta"
          disabled={ctaDisabled}
          loading={ctaLoading}
          aria-label={ctaAriaLabel || ctaLabel}
          onClick={onCtaClick}
        >
          {ctaLabel}
        </Button>
      )}

      {note && (
        <Text type="secondary" className="booking-summary-note">
          {note}
        </Text>
      )}
    </Card>
  );
};

export default BookingSummaryCard;
