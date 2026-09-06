const seatService = require("../services/seatService");

const getSeatById = async (req, res, next) => {
    try {
        const seat = await seatService.getSeatById(req, req.params.id);

        return res.send({
            success: true,
            message: "Seat fetched successfully",
            data: seat,
        });
    } catch (error) {
        next(error);
    }
};

const getSeatsByScreen = async (req, res, next) => {
    try {
        const result = await seatService.getSeatsByScreen(req, req.params.screenId);

        return res.send({
            success: true,
            message: "Screen seats fetched successfully",
            data: result.seats,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

const createSeat = async (req, res, next) => {
    try {
        const seat = await seatService.createSeat(req, req.body);

        return res.status(201).send({
            success: true,
            message: "Seat has been added",
            data: seat,
        });
    } catch (error) {
        next(error);
    }
};

const updateSeat = async (req, res, next) => {
    try {
        const seat = await seatService.updateSeat(req, req.params.id, req.body);

        return res.send({
            success: true,
            message: "Seat has been updated",
            data: seat,
        });
    } catch (error) {
        next(error);
    }
};

const deleteSeat = async (req, res, next) => {
    try {
        const seat = await seatService.disableSeat(req, req.params.id);

        return res.send({
            success: true,
            message: "Seat has been disabled",
            data: seat,
        });
    } catch (error) {
        next(error);
    }
};

const bulkCreateSeats = async (req, res, next) => {
    try {
        const seats = await seatService.bulkCreateSeats(req, req.params.screenId, req.body.rows);

        return res.status(201).send({
            success: true,
            message: "Seats have been added",
            data: seats,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSeatById,
    getSeatsByScreen,
    createSeat,
    updateSeat,
    deleteSeat,
    bulkCreateSeats,
};
