const Seat = require("../models/seatSchema");

const createSeat = (payload) => Seat.create(payload);

const insertSeats = (payloads) => Seat.insertMany(payloads, { ordered: true });

const findById = (id) => Seat.findById(id)
    .populate({
        path: "screen",
        select: "name screenNumber capacity theatre isActive",
        populate: {
            path: "theatre",
            select: "name owner isActive",
        },
    });

const findByScreen = (screenId) => Seat.find({ screen: screenId }).sort({ row: 1, column: 1 });

const countActiveByScreen = (screenId) => Seat.countDocuments({ screen: screenId, isActive: true });

const findDuplicateSeatNumber = ({ screen, seatNumber, excludeId }) => {
    const query = { screen, seatNumber };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    return Seat.findOne(query);
};

const findDuplicatePosition = ({ screen, row, column, excludeId }) => {
    const query = { screen, row, column };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    return Seat.findOne(query);
};

const updateSeat = (id, payload) => Seat.findByIdAndUpdate(
    id,
    payload,
    {
        returnDocument: "after",
        runValidators: true,
    }
);

module.exports = {
    createSeat,
    insertSeats,
    findById,
    findByScreen,
    countActiveByScreen,
    findDuplicateSeatNumber,
    findDuplicatePosition,
    updateSeat,
};
