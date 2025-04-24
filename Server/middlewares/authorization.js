const jwt = require("jsonwebtoken");

const validateJWT = (req, res, next) => {
    try {
        const access_token = req?.headers?.authorization?.split(" ")[1];
        const decode = jwt.verify(access_token, process.env.SECRET_KEY);
        req.body = {
            email : decode?.email,
            userId: decode?.userId,
            ...req.body
        }
        next();
    } catch (error) {
        res.status(401);
        next(error);
    }
};

module.exports = {
    validateJWT
};