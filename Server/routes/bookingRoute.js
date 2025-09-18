
const router = require("express").Router();
const { bookSeat, createOrder, getBookingsByUserId, validateSeats } = require("../controllers/BookingController");

router.post("/validateSeats", validateSeats)
router.post("/bookSeat", bookSeat);
router.post("/createOrder", createOrder);
router.get("/:id", getBookingsByUserId);

module.exports = router;