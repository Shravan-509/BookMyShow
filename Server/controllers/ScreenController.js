const screenService = require("../services/screenService");

const getScreens = async (req, res, next) => {
    try {
        const screens = await screenService.getScreens(req);

        return res.send({
            success: true,
            message: "Screens fetched successfully",
            data: screens,
        });
    } catch (error) {
        next(error);
    }
};

const getScreenById = async (req, res, next) => {
    try {
        const screen = await screenService.getScreenById(req, req.params.id);

        return res.send({
            success: true,
            message: "Screen fetched successfully",
            data: screen,
        });
    } catch (error) {
        next(error);
    }
};

const getScreensByTheatre = async (req, res, next) => {
    try {
        const activeOnly = req.query.activeOnly === "true";
        const screens = await screenService.getScreensByTheatre(req, req.params.theatreId, { activeOnly });

        return res.send({
            success: true,
            message: "Theatre screens fetched successfully",
            data: screens,
        });
    } catch (error) {
        next(error);
    }
};

const createScreen = async (req, res, next) => {
    try {
        const screen = await screenService.createScreen(req, req.body);

        return res.status(201).send({
            success: true,
            message: "Screen has been added",
            data: screen,
        });
    } catch (error) {
        next(error);
    }
};

const updateScreen = async (req, res, next) => {
    try {
        const screen = await screenService.updateScreen(req, req.params.id, req.body);

        return res.send({
            success: true,
            message: "Screen has been updated",
            data: screen,
        });
    } catch (error) {
        next(error);
    }
};

const deleteScreen = async (req, res, next) => {
    try {
        const screen = await screenService.deleteScreen(req, req.params.id);

        return res.send({
            success: true,
            message: screen.deleted ? "Screen deleted successfully" : "Screen has been deactivated",
            data: screen,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getScreens,
    getScreenById,
    getScreensByTheatre,
    createScreen,
    updateScreen,
    deleteScreen,
};
