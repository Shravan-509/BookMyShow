import { CheckOutlined } from "@ant-design/icons";

const DEFAULT_STEPS = [
  { key: "showtime", title: "Showtime", subtitle: "Choose your show" },
  { key: "seats", title: "Seats", subtitle: "Select your seats" },
  { key: "checkout", title: "Checkout", subtitle: "Payment & details" },
  { key: "confirmation", title: "Confirmation", subtitle: "Tickets booked" },
];

const BookingProgress = ({ current = "showtime", steps = DEFAULT_STEPS }) => {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === current),
  );

  return (
    <nav className="booking-progress" aria-label="Booking progress">
      {steps.map((step, index) => {
        const status =
          index < currentIndex ? "complete" : index === currentIndex ? "active" : "upcoming";

        return (
          <div className={`booking-progress-step ${status}`} key={step.key}>
            <span className="booking-progress-marker">
              {status === "complete" ? <CheckOutlined aria-hidden="true" /> : index + 1}
            </span>
            <span className="booking-progress-copy">
              <span className="booking-progress-title">{step.title}</span>
              <span className="booking-progress-subtitle">{step.subtitle}</span>
            </span>
          </div>
        );
      })}
    </nav>
  );
};

export default BookingProgress;
