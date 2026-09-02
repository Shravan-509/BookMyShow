const cityService = require("../services/cityService");

const getCities = async (req, res, next) => {
    try {
        const includeInactive = req.user?.role === "admin" && req.query.includeInactive === "true";
        const cities = await cityService.getCities({ includeInactive });

        return res.send({
            success: true,
            message: "Cities fetched successfully",
            data: cities,
        });
    } catch (error) {
        next(error);
    }
};

const getCityById = async (req, res, next) => {
    try {
        const city = await cityService.getCityById(req.params.id);

        return res.send({
            success: true,
            message: "City fetched successfully",
            data: city,
        });
    } catch (error) {
        next(error);
    }
};

const createCity = async (req, res, next) => {
    try {
        const city = await cityService.createCity(req.body);

        return res.status(201).send({
            success: true,
            message: "City has been added",
            data: city,
        });
    } catch (error) {
        next(error);
    }
};

const updateCity = async (req, res, next) => {
    try {
        const city = await cityService.updateCity(req.params.id, req.body);

        return res.send({
            success: true,
            message: "City has been updated",
            data: city,
        });
    } catch (error) {
        next(error);
    }
};

const deactivateCity = async (req, res, next) => {
    try {
        const city = await cityService.deactivateCity(req.params.id);

        return res.send({
            success: true,
            message: "City has been deactivated",
            data: city,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCities,
    getCityById,
    createCity,
    updateCity,
    deactivateCity,
};
