
const router = require("express").Router();
const { bookSeat, createOrder, getBookingsByUserId } = require("../controllers/BookingController");

router.post("/bookSeat", bookSeat);
router.post("/createOrder", createOrder);
router.get("/:id", getBookingsByUserId)

module.exports = router;