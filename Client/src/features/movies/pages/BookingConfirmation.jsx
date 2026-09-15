import { Button, Card, QRCode, Tag, Tooltip, Typography } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  HomeOutlined,
  MailOutlined,
  ShoppingOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import BookingProgress from "../../../components/booking/BookingProgress";
import BookingSummaryCard from "../../../components/booking/BookingSummaryCard";
import { selectBookingData } from "../../../redux/slices/bookingSlice";
import { formatDate, formatParsedTime } from "../../../utils/dateFormatter";
import { getBookingScreenDisplayName, getScreenDisplayName } from "../../../utils/screenDisplay";
import {
  formatCurrency,
  getBookingPaidTotal,
  getBookingSeatPricing,
  getBookingTicketAmount,
  groupSeatPricing,
} from "../../../utils/ticketPricing";

const { Text, Title, Paragraph } = Typography;

const isFiniteNumber = (value) => (
  value !== null
  && value !== undefined
  && Number.isFinite(Number(value))
);

const normalizeBookingIdentifier = (booking, routeBookingId) => (
  booking?.bookingId || booking?._id || routeBookingId || ""
);

const buildConfirmationDetails = ({ booking, routeState = {}, routeBookingId }) => {
  const bookingContext = routeState.bookingContext || {};
  const contextShow = bookingContext.show || {};
  const bookingShow = typeof booking?.show === "object" && booking.show !== null ? booking.show : {};
  const movie = contextShow.movie || bookingShow.movie || booking?.movie || {
    movieName: booking?.movieTitle,
    poster: booking?.poster,
    duration: booking?.duration,
  };
  const theatre = contextShow.theatre || bookingShow.theatre || booking?.theatre || {
    name: booking?.theatreName,
  };
  const showForSummary = {
    ...bookingShow,
    ...contextShow,
    movie,
    theatre,
    screen: contextShow.screen || bookingShow.screen || booking?.screen,
    date: contextShow.date || bookingShow.date || booking?.showDate,
    time: contextShow.time || bookingShow.time || booking?.showTime,
    ticketPrice: booking?.ticketPrice ?? contextShow.ticketPrice ?? bookingShow.ticketPrice,
    ticketPricing: contextShow.ticketPricing || bookingShow.ticketPricing,
  };
  const selectedSeats = booking?.seats || bookingContext.seats || [];
  const bookingIdentifier = normalizeBookingIdentifier(booking, routeBookingId);
  const screenName = (
    bookingContext.screenDisplayName
    || getBookingScreenDisplayName(booking)
    || getScreenDisplayName(showForSummary.screen)
  );
  const formattedDate = (
    bookingContext.formattedShowDate
    || (showForSummary.date ? formatDate(showForSummary.date, "EEE, dd MMM, yyyy") : "")
  );
  const formattedTime = (
    bookingContext.formattedShowTime
    || (showForSummary.time ? formatParsedTime(showForSummary.time) : "")
  );
  const bookingWithFallbacks = {
    ...booking,
    seats: selectedSeats,
    ticketPrice: booking?.ticketPrice ?? showForSummary.ticketPrice,
    seatPricing: booking?.seatPricing || bookingContext.seatPricing,
  };
  const seatPricing = getBookingSeatPricing(bookingWithFallbacks);
  const ticketAmount = isFiniteNumber(booking?.ticketAmount)
    ? getBookingTicketAmount(booking)
    : Number(bookingContext.ticketAmount || getBookingTicketAmount(bookingWithFallbacks));
  const convenienceFee = isFiniteNumber(booking?.convenienceFee)
    ? Number(booking.convenienceFee)
    : (
        isFiniteNumber(bookingContext.convenienceFee)
          ? Number(bookingContext.convenienceFee)
          : null
      );
  const totalAmount = isFiniteNumber(booking?.amount)
    ? getBookingPaidTotal(booking)
    : (
        isFiniteNumber(bookingContext.totalAmount)
          ? Number(bookingContext.totalAmount)
          : null
      );

  return {
    bookingIdentifier,
    showForSummary,
    selectedSeats,
    seatPricing,
    seatPricingGroups: groupSeatPricing(seatPricing),
    ticketAmount,
    convenienceFee,
    totalAmount,
    formattedDate,
    formattedTime,
    screenName,
  };
};

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId: routeBookingId } = useParams();
  const reduxBookingData = useSelector(selectBookingData);
  const stateBooking = location.state?.booking;
  const matchedReduxBooking = (
    reduxBookingData
    && [reduxBookingData.bookingId, reduxBookingData._id].includes(routeBookingId)
  ) ? reduxBookingData : null;
  const booking = stateBooking || matchedReduxBooking;

  const details = useMemo(() => (
    booking
      ? buildConfirmationDetails({
          booking,
          routeState: location.state,
          routeBookingId,
        })
      : null
  ), [booking, location.state, routeBookingId]);

  if (!booking || !details?.bookingIdentifier) {
    return (
      <main className="booking-confirmation-shell recovery" aria-labelledby="booking-recovery-title">
        <div className="booking-confirmation-container">
          <BookingProgress current="confirmation" />
          <Card className="booking-confirmation-recovery-card" variant="borderless">
            <CheckCircleOutlined aria-hidden="true" className="booking-confirmation-recovery-icon" />
            <Title level={2} id="booking-recovery-title">Booking details are available in My Bookings</Title>
            <Paragraph type="secondary">
              This confirmation page needs the booking details from the completed checkout session.
              You can view your confirmed tickets and QR details from purchase history.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingOutlined aria-hidden="true" />}
              onClick={() => navigate("/my-profile/purchase-history")}
            >
              View My Bookings
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  const {
    bookingIdentifier,
    showForSummary,
    selectedSeats,
    seatPricing,
    seatPricingGroups,
    ticketAmount,
    convenienceFee,
    totalAmount,
    formattedDate,
    formattedTime,
    screenName,
  } = details;
  const movieName = showForSummary.movie?.movieName || "Movie";
  const poster = showForSummary.movie?.poster;
  const displayTotal = typeof totalAmount === "number"
    ? totalAmount
    : (
        typeof convenienceFee === "number"
          ? ticketAmount + convenienceFee
          : null
      );

  return (
    <main className="booking-confirmation-shell" aria-labelledby="booking-confirmation-title">
      <div className="booking-confirmation-container">
        <BookingProgress current="confirmation" />

        <section
          className="booking-confirmation-hero"
          aria-label="Booking confirmation summary"
          aria-live="polite"
        >
          <Card className="booking-confirmation-ticket" variant="borderless">
            <div className="booking-confirmation-success">
              <span className="booking-confirmation-check" aria-hidden="true">
                <CheckCircleOutlined />
              </span>
              <div>
                <Title level={1} id="booking-confirmation-title">Booking Confirmed!</Title>
                <Paragraph>
                  Your tickets have been booked successfully.
                </Paragraph>
                <Text type="secondary" className="booking-confirmation-email-note">
                  <MailOutlined aria-hidden="true" /> A ticket PDF is sent to your registered email when delivery succeeds.
                </Text>
              </div>
            </div>

            <div className="booking-confirmation-ticket-divider" aria-hidden="true" />

            <div className="booking-confirmation-id-panel" aria-label="Booking identifier">
              <Text type="secondary">Booking ID</Text>
              <Text strong className="booking-confirmation-id">{bookingIdentifier}</Text>
            </div>
          </Card>
        </section>

        <section className="booking-confirmation-actions" aria-label="Booking actions">
          <Button
            type="primary"
            size="large"
            icon={<ShoppingOutlined aria-hidden="true" />}
            onClick={() => navigate("/my-profile/purchase-history")}
          >
            View My Bookings
          </Button>
          <Button
            size="large"
            icon={<HomeOutlined aria-hidden="true" />}
            onClick={() => navigate("/home")}
          >
            Explore More Movies
          </Button>
          <Tooltip title="Ticket PDF download is currently delivered through the booking email.">
            <Button
              size="large"
              icon={<DownloadOutlined aria-hidden="true" />}
              disabled
              aria-label="Download Ticket unavailable"
            >
              Download Ticket
            </Button>
          </Tooltip>
          <Text type="secondary" className="booking-confirmation-download-note">
            Email delivery only
          </Text>
        </section>

        <section className="booking-confirmation-grid" aria-label="Confirmed booking details">
          <Card
            className="booking-confirmation-info-card"
            variant="borderless"
            aria-label="Ticket details"
          >
            <div className="booking-confirmation-info-header">
              <Title level={3}>Ticket Details</Title>
              <Tag color="success">Confirmed</Tag>
            </div>

            <div className="booking-confirmation-movie-row">
              {poster && (
                <img src={poster} alt={`${movieName} poster`} />
              )}
              <div>
                <Title level={4}>{movieName}</Title>
                {showForSummary.movie?.duration && (
                  <Text type="secondary">{showForSummary.movie.duration} min</Text>
                )}
              </div>
            </div>

            <div className="booking-confirmation-detail-list">
              {showForSummary.theatre?.name && (
                <div>
                  <Text type="secondary">Theatre</Text>
                  <Text strong>{showForSummary.theatre.name}</Text>
                </div>
              )}
              {screenName && (
                <div>
                  <Text type="secondary">Screen</Text>
                  <Text strong><VideoCameraOutlined aria-hidden="true" /> {screenName}</Text>
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
              <div>
                <Text type="secondary">Seats</Text>
                <Text strong>{selectedSeats.join(", ")}</Text>
              </div>
            </div>

            {seatPricingGroups.length > 0 && (
              <div className="booking-confirmation-seat-groups">
                {seatPricingGroups.map((group) => (
                  <div key={`${group.seatType}-${group.price}`}>
                    <span>
                      <Text strong>{group.seatTypeLabel}</Text>
                      <Text type="secondary">{group.seats.join(", ")}</Text>
                    </span>
                    <Text strong>
                      {group.count} x {formatCurrency(group.price)} = {formatCurrency(group.total)}
                    </Text>
                  </div>
                ))}
              </div>
            )}

            <div className="booking-confirmation-qr" aria-label="Booking QR code">
              <div className="booking-confirmation-qr-code">
                <QRCode value={bookingIdentifier} size={112} />
              </div>
              <div className="booking-confirmation-qr-copy">
                <Text strong>Entry QR Code</Text>
                <Text type="secondary">Scan this code at the cinema entrance.</Text>
                <Text type="secondary">
                  Booking ID: <Text strong>{bookingIdentifier}</Text>
                </Text>
              </div>
            </div>
          </Card>

          <aside className="booking-confirmation-summary">
            <BookingSummaryCard
              show={showForSummary}
              screenName={screenName}
              formattedDate={formattedDate}
              formattedTime={formattedTime}
              selectedSeats={selectedSeats}
              seatPricing={seatPricing}
              ticketAmount={ticketAmount}
              convenienceFee={convenienceFee}
              totalAmount={displayTotal}
              showCta={false}
              showContextDetails={false}
              note="Enjoy the show. Arrive a little early with a valid ID if required."
            />
          </aside>
        </section>
      </div>
    </main>
  );
};

export default BookingConfirmation;
