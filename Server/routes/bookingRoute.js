
const router = require("express").Router();
const { bookSeat, createOrder, getBookingsByUserId, validateSeats, getAllBookings, getBookingsByTheatre, getRevenueByOwner } = require("../controllers/BookingController");

router.post("/validateSeats", validateSeats)
router.post("/bookSeat", bookSeat);
router.post("/createOrder", createOrder);
router.get("/:id", getBookingsByUserId);
router.get("/admin/all", getAllBookings)
router.get("/theatre/:theatreId", getBookingsByTheatre)
router.get("/revenue/:ownerId", getRevenueByOwner)

// createBooking()
// getBookings()
// getBookingById()
// processPayment()
// cancelBooking()
// generateTicket()

module.exports = router;