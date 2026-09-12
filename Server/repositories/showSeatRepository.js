const ShowSeat = require("../models/showSeatSchema");

const findByShow = (showId, options = {}) => (
    ShowSeat.find({ show: showId }, null, options).sort({ row: 1, column: 1 })
);

const findAvailabilityByShow = (showId, options = {}) => (
    ShowSeat.find(
        { show: showId },
        "_id seat seatNumber row column seatType status",
        options
    ).lean()
);

const findByShowAndStatus = (showId, status, options = {}) => (
    ShowSeat.find({ show: showId, status }, null, options).sort({ row: 1, column: 1 })
);

const countByShow = (showId, options = {}) => (
    ShowSeat.countDocuments({ show: showId }, options)
);

const findByShowAndSeat = (showId, seatId, options = {}) => (
    ShowSeat.findOne({ show: showId, seat: seatId }, null, options)
);

const findByShowAndSeatNumbers = (showId, seatNumbers, options = {}) => (
    ShowSeat.find(
        { show: showId, seatNumber: { $in: seatNumbers } },
        null,
        options
    )
);

const markSeatsBooked = ({ showId, seatNumbers, bookingId, bookedAt }, options = {}) => (
    ShowSeat.updateMany(
        {
            show: showId,
            seatNumber: { $in: seatNumbers },
            status: ShowSeat.SHOW_SEAT_STATUS.AVAILABLE,
        },
        {
            $set: {
                status: ShowSeat.SHOW_SEAT_STATUS.BOOKED,
                booking: bookingId,
                bookedAt,
            },
        },
        options
    )
);

const insertMany = (showSeats, options = {}) => (
    ShowSeat.insertMany(showSeats, { ordered: true, ...options })
);

const deleteByShow = (showId, options = {}) => (
    ShowSeat.deleteMany({ show: showId }, options)
);

module.exports = {
    findByShow,
    findAvailabilityByShow,
    findByShowAndStatus,
    countByShow,
    findByShowAndSeat,
    findByShowAndSeatNumbers,
    markSeatsBooked,
    insertMany,
    deleteByShow,
};
