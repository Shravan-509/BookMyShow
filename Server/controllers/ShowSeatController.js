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

module.exports = {
    getShowSeatAvailability,
};
