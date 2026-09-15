import React, { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  FullscreenOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Card, Divider, Form, Input, Skeleton, Spin, Tag, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import BookingProgress from "../../../components/booking/BookingProgress";
import BookingSummaryCard from "../../../components/booking/BookingSummaryCard";
import { SeatLayout } from "../../../components/SeatLayout";
import SeatRecommendation from "../../../components/SeatRecommendation";
import { SHOWSEAT_LAYOUT_STATUS, SHOWSEAT_STATUS } from "../../../components/seatLayoutUtils";
import { useAuth } from "../../../hooks/useAuth";
import PaymentSummary from "./Checkout";
import {
  getShowByIdRequest,
  selectSelectedShow,
  selectShowError,
  selectShowLoading,
} from "../../../redux/slices/showSlice";
import {
  clearShowSeats,
  fetchShowSeatsRequest,
  selectShowSeatError,
  selectShowSeatInventory,
  selectShowSeatLoading,
} from "../../../redux/slices/showSeatSlice";
import { notify } from "../../../utils/notificationUtils";
import { formatDate, formatParsedTime } from "../../../utils/dateFormatter";
import { getScreenDisplayName } from "../../../utils/screenDisplay";
import {
  buildSelectedSeatPricing,
  formatCurrency,
  getSeatTypeLabel,
  resolveSeatTypePrice,
  SUPPORTED_SEAT_TYPES,
} from "../../../utils/ticketPricing";

const { Text, Title } = Typography;
const MAX_SELECTABLE_SEATS = 5;
const MIN_TICKET_COUNT = 1;
const EMPTY_SHOW_SEATS = [];

const LoadingSkeleton = React.memo(() => (
  <div className="booking-page-shell">
    <div className="booking-page-container">
      <Card className="w-full" variant="borderless">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    </div>
  </div>
));

LoadingSkeleton.displayName = "LoadingSkeleton";

const ScreenDisplay = React.memo(() => (
  <div className="screen-direction-indicator">
    <svg
      width="300"
      height="50"
      viewBox="0 0 300 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ minHeight: "50px" }}
    >
      <polygon points="10,40 30,10 270,10 290,40" fill="#D6E9FF" stroke="#B0D4FF" strokeWidth="1" />
      <polygon points="10,40 290,40 285,45 15,45" fill="#EAF4FF" stroke="#B0D4FF" strokeWidth="1" />
    </svg>
    <div>All eyes this way please!</div>
  </div>
));

ScreenDisplay.displayName = "ScreenDisplay";

const Booking = () => {
  const { user } = useAuth();
  const params = useParams();
  const dispatch = useDispatch();
  const [contactForm] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [desiredTicketCount, setDesiredTicketCount] = useState(2);
  const [isSeatMapExpanded, setIsSeatMapExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [seatPreferences] = useState({
    preferCenter: true,
    preferBack: false,
    preferAisle: false,
  });

  const loading = useSelector(selectShowLoading);
  const showError = useSelector(selectShowError);
  const show = useSelector(selectSelectedShow);
  const showSeatInventory = useSelector(selectShowSeatInventory);
  const showSeatLoading = useSelector(selectShowSeatLoading);
  const showSeatError = useSelector(selectShowSeatError);
  const resolvedTotalSeats = show?.screen?.capacity ?? show?.totalSeats ?? 0;
  const hasInitializedInventory = showSeatInventory?.layoutStatus === SHOWSEAT_LAYOUT_STATUS.INITIALIZED;
  const isScreenAwareShow = Boolean(show?.screen);
  const loadedShowId = show?._id?.toString?.() || show?._id || show?.id;
  const inventoryShowId = showSeatInventory?.showId?.toString?.() || showSeatInventory?.showId;
  const showSeatInventoryBelongsToShow = inventoryShowId === loadedShowId;
  const canRenderPhysicalLayout = isScreenAwareShow && hasInitializedInventory && showSeatInventoryBelongsToShow;
  const canRenderLegacyLayout = !isScreenAwareShow || showSeatInventory?.layoutStatus === SHOWSEAT_LAYOUT_STATUS.LEGACY;
  const shouldShowSeatInventoryLoading = isScreenAwareShow && (showSeatLoading || !showSeatInventoryBelongsToShow) && !showSeatError;
  const shouldShowSeatInventoryError = isScreenAwareShow && Boolean(showSeatError);
  const screenDisplayName = getScreenDisplayName(show?.screen);
  const showSeatsForPricing = canRenderPhysicalLayout ? showSeatInventory.seats : EMPTY_SHOW_SEATS;

  const selectedSeatPricing = useMemo(() => (
    buildSelectedSeatPricing(show, showSeatsForPricing, selectedSeats)
  ), [selectedSeats, show, showSeatsForPricing]);

  const getSeatPrice = useCallback(
    (seatType) => resolveSeatTypePrice(show, seatType),
    [show],
  );

  const physicalAvailableSeats = useMemo(() => (
    canRenderPhysicalLayout
      ? showSeatInventory.seats.filter((seat) => seat.status === SHOWSEAT_STATUS.AVAILABLE)
      : []
  ), [canRenderPhysicalLayout, showSeatInventory]);

  const recommendationGroupSize = desiredTicketCount;
  const formattedShowDate = formatDate(show?.date, "EEE, dd MMM, yyyy");
  const formattedShowTime = formatParsedTime(show?.time);
  const showtimeRouteDate = show?.date ? format(new Date(show.date), "yyyyMMdd") : format(new Date(), "yyyyMMdd");
  const bookingProgressStep = currentStep === 0 ? "seats" : "checkout";

  const seatLegendItems = useMemo(() => (
    SUPPORTED_SEAT_TYPES.map((seatType) => ({
      seatType,
      label: getSeatTypeLabel(seatType),
      price: getSeatPrice(seatType),
    }))
  ), [getSeatPrice]);

  const formInitialValues = useMemo(
    () => ({
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
    }),
    [user?.name, user?.email, user?.phone],
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    dispatch(clearShowSeats());
    dispatch(getShowByIdRequest(params.id));
    return () => {
      dispatch(clearShowSeats());
    };
  }, [dispatch, params.id]);

  useEffect(() => {
    if (!params.id || !loadedShowId || loadedShowId !== params.id) {
      return;
    }

    if (!show?.screen) {
      dispatch(clearShowSeats());
      return;
    }

    dispatch(fetchShowSeatsRequest({ showId: loadedShowId }));
  }, [dispatch, loadedShowId, params.id, show?.screen]);

  const handlePreviousStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  const handleNextStep = useCallback(() => {
    if (currentStep === 0 && selectedSeats.length === 0) {
      notify("warning", "Please select at least one seat");
      return;
    }

    if (currentStep === 1) {
      contactForm
        .validateFields()
        .then(() => {
          setCurrentStep((prev) => prev + 1);
        })
        .catch((info) => {
          notify("warning", `Validate failed : ${info}`);
        });
      return;
    }

    setCurrentStep((prev) => prev + 1);
  }, [contactForm, currentStep, selectedSeats.length]);

  const incrementTicketCount = useCallback(() => {
    setDesiredTicketCount((prev) => Math.min(MAX_SELECTABLE_SEATS, prev + 1));
  }, []);

  const decrementTicketCount = useCallback(() => {
    setDesiredTicketCount((prev) => Math.max(MIN_TICKET_COUNT, selectedSeats.length, prev - 1));
  }, [selectedSeats.length]);

  const handleSeatSelection = useCallback(
    (seatId) => {
      if (selectedSeats.includes(seatId)) {
        setSelectedSeats((prev) => prev.filter((id) => id !== seatId));
      } else if (selectedSeats.length < desiredTicketCount) {
        setSelectedSeats((prev) => [...prev, seatId]);
      } else {
        notify("warning", `You've selected ${desiredTicketCount} of ${desiredTicketCount} seats.`);
      }
    },
    [desiredTicketCount, selectedSeats],
  );

  const handleRecommendedSeatSelection = useCallback((recommendedSeats) => {
    setSelectedSeats([]);
    recommendedSeats.slice(0, desiredTicketCount).forEach((seat) => {
      setSelectedSeats((prev) => {
        if (!prev.includes(seat.seatId) && prev.length < desiredTicketCount) {
          return [...prev, seat.seatId];
        }
        return prev;
      });
    });
  }, [desiredTicketCount]);

  const renderTicketCounter = () => (
    <div className="ticket-count-control" aria-label="Number of tickets">
      <Text type="secondary">Number of tickets</Text>
      <div className="ticket-count-stepper">
        <Button
          aria-label="Decrease ticket count"
          icon={<MinusOutlined aria-hidden="true" />}
          disabled={desiredTicketCount <= MIN_TICKET_COUNT || desiredTicketCount <= selectedSeats.length}
          onClick={decrementTicketCount}
        />
        <span aria-live="polite">{desiredTicketCount}</span>
        <Button
          aria-label="Increase ticket count"
          icon={<PlusOutlined aria-hidden="true" />}
          disabled={desiredTicketCount >= MAX_SELECTABLE_SEATS}
          onClick={incrementTicketCount}
        />
      </div>
    </div>
  );

  const renderSeatLegend = () => (
    <div className="seat-selection-legend" aria-label="Seat legend">
      <div className="seat-legend-group" aria-label="Seat availability">
        <span><i className="legend-seat available" /> Available</span>
        <span><i className="legend-seat selected" /> Selected</span>
        <span><i className="legend-seat booked" /> Booked</span>
      </div>
      <div className="seat-legend-divider" aria-hidden="true" />
      <div className="seat-legend-group" aria-label="Seat category pricing">
        {seatLegendItems.map((item) => (
          <span key={item.seatType}>
            <i className={`legend-seat type-${item.seatType.toLowerCase()}`} />
            {item.label} {formatCurrency(item.price)}
          </span>
        ))}
      </div>
    </div>
  );

  const renderSeatMapContent = ({ expanded = false } = {}) => (
    <div className={expanded ? "seat-map-expanded-content" : "seat-selection-area"}>
      {shouldShowSeatInventoryLoading && (
        <Card className="text-center py-12 bg-gray-50! border-gray-200!">
          <Spin />
          <div className="mt-3 text-sm text-gray-600">Loading seat layout...</div>
        </Card>
      )}

      {shouldShowSeatInventoryError && (
        <Card className="text-center py-10 bg-red-50! border-red-100!">
          <Title level={5} className="mb-2!">Seat layout unavailable</Title>
          <Text type="secondary">{showSeatError}</Text>
        </Card>
      )}

      {!shouldShowSeatInventoryLoading && !shouldShowSeatInventoryError && (canRenderPhysicalLayout || canRenderLegacyLayout) && (
        <SeatLayout
          totalSeats={resolvedTotalSeats}
          bookedSeats={show?.bookedSeats}
          selectedSeats={selectedSeats}
          onSeatSelect={handleSeatSelection}
          layoutStatus={canRenderPhysicalLayout ? SHOWSEAT_LAYOUT_STATUS.INITIALIZED : SHOWSEAT_LAYOUT_STATUS.LEGACY}
          showSeats={showSeatsForPricing}
          getSeatPrice={getSeatPrice}
          showSeatTypeLegend={false}
          expanded={expanded}
        />
      )}

      <ScreenDisplay />
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!show) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-12 bg-gray-50 flex flex-col items-center justify-center">
        <Title level={3}>Booking details not found</Title>
        <Link to="/">
          <Button type="primary" className="mt-4">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  if (showError) {
    notify("error", "Sorry, something went wrong", showError);
  }

  return (
    <main className="booking-page-shell">
      <div className="booking-page-container">
        <Link className="booking-back-link" to={`/movie/${show?.movie?._id}/${showtimeRouteDate}`}>
          <ArrowLeftOutlined className="h-4 w-4 mr-2" />
          Back to Showtimes
        </Link>

        <BookingProgress current={bookingProgressStep} />

        <div className="booking-workspace">
          <section className="booking-main-column">
            <Card className="show-context-card" variant="borderless">
              <div className="show-context-content">
                {show?.movie?.poster && (
                  <img src={show.movie.poster} alt={`${show.movie.movieName} poster`} />
                )}
                <div>
                  <Title level={3}>{show?.movie?.movieName}</Title>
                  <div className="show-context-meta">
                    <Text>{show?.theatre.name}</Text>
                    {screenDisplayName && <Tag>{screenDisplayName}</Tag>}
                    <span className="show-context-datetime">
                      <CalendarOutlined aria-hidden="true" />
                      <span>{formattedShowDate}</span>
                      <span aria-hidden="true">|</span>
                      <ClockCircleOutlined aria-hidden="true" />
                      <span>{formattedShowTime}</span>
                    </span>
                  </div>
                </div>
                <Link className="show-context-change" to={`/movie/${show?.movie?._id}/${showtimeRouteDate}`}>
                  Change
                </Link>
              </div>
            </Card>

            {currentStep === 0 && (
              <>
                <Card className="seat-selection-card" variant="borderless">
                  <div className="seat-selection-toolbar">
                    <div>
                      <Title level={4}>Select Seats</Title>
                      <Text type="secondary">
                        {selectedSeats.length === desiredTicketCount
                          ? `You've selected ${selectedSeats.length} of ${desiredTicketCount} seats.`
                          : `${selectedSeats.length} of ${desiredTicketCount} seats selected`}
                      </Text>
                    </div>
                    {renderTicketCounter()}
                  </div>

                  {!isSeatMapExpanded && (
                    <div className="seat-selection-legend-row">
                      {renderSeatLegend()}
                      <Button
                        aria-label="Expand seat map"
                        icon={<FullscreenOutlined aria-hidden="true" />}
                        onClick={() => setIsSeatMapExpanded(true)}
                      >
                        Expand
                      </Button>
                    </div>
                  )}

                  {!isSeatMapExpanded && renderSeatMapContent()}
                </Card>

                <SeatRecommendation
                  totalSeats={resolvedTotalSeats}
                  bookedSeats={show?.bookedSeats}
                  availableSeats={physicalAvailableSeats}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleRecommendedSeatSelection}
                  groupSize={recommendationGroupSize}
                  preferences={seatPreferences}
                  getSeatPrice={getSeatPrice}
                />
              </>
            )}

            {currentStep === 1 && (
              <Card className="checkout-details-card" variant="borderless">
                <Title level={4} className="mb-6!">
                  Your Contact Details
                </Title>
                <Form form={contactForm} layout="vertical" initialValues={formInitialValues}>
                  <Form.Item
                    name="name"
                    label="Full Name"
                    rules={[{ required: true, message: "Please enter your name" }]}
                  >
                    <Input placeholder="Enter your full name" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email Address"
                    rules={[
                      { required: true, message: "Please enter your email" },
                      { type: "email", message: "Please enter a valid email" },
                    ]}
                  >
                    <Input placeholder="Enter your email address" />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[
                      { required: true, message: "Please enter your phone number" },
                      { pattern: /^[6-9]\d{9}$/, message: "Please enter a valid 10-digit phone number" },
                    ]}
                  >
                    <Input placeholder="Enter your 10-digit phone number" />
                  </Form.Item>

                  <Divider />

                  <div className="flex justify-between">
                    <Button size="large" onClick={handlePreviousStep}>
                      Back
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleNextStep}
                      className="bg-[#f84464]! hover:bg-[#dc3558]!"
                    >
                      Proceed to Pay
                    </Button>
                  </div>
                </Form>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="checkout-details-card" variant="borderless">
                <PaymentSummary
                  show={show}
                  seats={selectedSeats}
                  showSeats={showSeatsForPricing}
                  handlePreviousStep={handlePreviousStep}
                />
              </Card>
            )}
          </section>

          <aside className="booking-sidebar">
            <BookingSummaryCard
              show={show}
              screenName={screenDisplayName}
              formattedDate={formattedShowDate}
              formattedTime={formattedShowTime}
              selectedSeats={selectedSeats}
              seatPricing={selectedSeatPricing.seatPricing}
              ticketAmount={selectedSeatPricing.ticketAmount}
              ctaDisabled={selectedSeats.length === 0 || currentStep !== 0}
              onCtaClick={handleNextStep}
            />
          </aside>
        </div>

        {isSeatMapExpanded && (
          <div className="seat-map-expanded-overlay" role="dialog" aria-modal="true" aria-label="Expanded seat map">
            <div className="seat-map-expanded-panel">
              <div className="seat-map-expanded-header">
                <div>
                  <Title level={4}>Select Seats</Title>
                  <Text type="secondary">
                    {selectedSeats.length} of {desiredTicketCount} seats selected
                  </Text>
                </div>
                <Button
                  aria-label="Collapse seat map"
                  icon={<CloseOutlined aria-hidden="true" />}
                  onClick={() => setIsSeatMapExpanded(false)}
                >
                  Close
                </Button>
              </div>
              <div className="seat-map-expanded-tools">
                {renderSeatLegend()}
                {renderTicketCounter()}
              </div>
              {renderSeatMapContent({ expanded: true })}
            </div>
          </div>
        )}

        {isMobile && currentStep === 0 && (
          <div className="booking-mobile-cta">
            <div className="text-sm">
              <div className="font-medium">
                {selectedSeats.length} {selectedSeats.length === 1 ? "seat" : "seats"} selected
              </div>
              <div className="text-gray-600">{formatCurrency(selectedSeatPricing.ticketAmount)}</div>
            </div>
            <Button
              type="primary"
              size="large"
              onClick={handleNextStep}
              disabled={selectedSeats.length === 0}
              className="bg-[#f84464]! hover:bg-[#dc3558]! min-w-30!"
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Booking;
