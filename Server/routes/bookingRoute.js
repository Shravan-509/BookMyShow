
const router = require("express").Router();
const { bookSeat, createOrder, getBookingsByUserId, validateSeats, getAllBookings, getBookingsByTheatre, getRevenueByOwner } = require("../controllers/BookingController");
const { validateRole } = require("../middlewares/authorization");

router.post("/validateSeats", validateSeats)
router.post("/bookSeat", bookSeat);
router.post("/createOrder", createOrder);
router.get("/admin/all", validateRole(["admin"]), getAllBookings)
router.get("/theatre/:theatreId", validateRole(["admin", "partner"]), getBookingsByTheatre)
router.get("/revenue/:ownerId", validateRole(["admin", "partner"]), getRevenueByOwner)
router.get("/:id", getBookingsByUserId);

// createBooking()
// getBookings()
// getBookingById()
// processPayment()
// cancelBooking()
// generateTicket()

module.exports = router;
