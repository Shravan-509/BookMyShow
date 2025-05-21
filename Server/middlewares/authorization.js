const jwt = require("jsonwebtoken");

const validateJWT = (req, res, next) => {
    try {
         const access_token = req.cookies.access_token || req.header("x-auth-token");

         if(!access_token)
         {
            return res.status(401).json({ message: 'Unauthorized' })
         }
        // const access_token = req?.headers?.authorization?.split(" ")[1];
        //Verify Token
        const decoded = jwt.verify(access_token, process.env.JWT_SECRET);
        req.body = {
            // email : decode?.email,
            userId: decoded?.userId,
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