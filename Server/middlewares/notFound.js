const AppError = require("../utils/AppError");

const notFound = (req, res, next) => {
    next(new AppError("API route not found", 404, "ROUTE_NOT_FOUND"));
};

module.exports = notFound;
