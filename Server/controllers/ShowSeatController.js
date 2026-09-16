const showSeatService = require("../services/showSeatService");

const getShowSeatAvailability = async (req, res, next) => {
    try {
        const availability = await showSeatService.getShowSeatAvailability(req.params.showId);

        return res.send({
            success: true,
            message: "Show seats fetched successfully",
            data: availability,
        });
    } catch (error) {
        next(error);
    }
};

const acquireSeatLock = async (req, res, next) => {
    try {
        const lock = await showSeatService.acquireSeatLock({
            showId: req.params.showId,
            seats: req.body.seats,
            userId: req.userId,
        });

        return res.send({
            success: true,
            message: "Seat lock acquired successfully",
            data: lock,
        });
    } catch (error) {
        next(error);
    }
};

const refreshSeatLock = async (req, res, next) => {
    try {
        const lock = await showSeatService.refreshSeatLock({
            showId: req.params.showId,
            seats: req.body.seats,
            lockToken: req.body.lockToken,
            userId: req.userId,
        });

        return res.send({
            success: true,
            message: "Seat lock refreshed successfully",
            data: lock,
        });
    } catch (error) {
        next(error);
    }
};

const releaseSeatLock = async (req, res, next) => {
    try {
        const release = await showSeatService.releaseSeatLock({
            showId: req.params.showId,
            seats: req.body.seats,
            lockToken: req.body.lockToken,
            userId: req.userId,
        });

        return res.send({
            success: true,
            message: release.released
                ? "Seat lock released successfully"
                : "No active owned seat lock to release",
            data: release,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    acquireSeatLock,
    getShowSeatAvailability,
    refreshSeatLock,
    releaseSeatLock,
};
