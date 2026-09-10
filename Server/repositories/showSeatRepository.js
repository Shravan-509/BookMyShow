const ShowSeat = require("../models/showSeatSchema");

const findByShow = (showId, options = {}) => (
    ShowSeat.find({ show: showId }, null, options).sort({ row: 1, column: 1 })
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

const insertMany = (showSeats, options = {}) => (
    ShowSeat.insertMany(showSeats, { ordered: true, ...options })
);

const deleteByShow = (showId, options = {}) => (
    ShowSeat.deleteMany({ show: showId }, options)
);

module.exports = {
    findByShow,
    findByShowAndStatus,
    countByShow,
    findByShowAndSeat,
    insertMany,
    deleteByShow,
};
