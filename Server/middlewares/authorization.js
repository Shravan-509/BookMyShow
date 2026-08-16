const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");

const validateJWT = async (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        const access_token = req.cookies.access_token || req.header("authorization")?.split(" ")[1] || req.header("x-auth-token");

        if (!access_token) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
        }

        // Verify JWT token with expiration check
        const decoded = jwt.verify(access_token, process.env.JWT_SECRET);
        
        // Validate token structure
        if (!decoded.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
        }

        const user = await User.findById(decoded.userId).select("role");
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
        }

        // Attach userId to request for downstream use
        req.userId = decoded.userId;
        req.user = { userId: decoded.userId, role: user.role };
        
        next();
    } catch (error) {
        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        
        console.error('[v0] JWT validation error:', error.message);
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
};

// Validate user role
const validateRole = (roles = []) => {
    return (req, res, next) => {
        try {
            const userRole = req.user?.role;
            
            if (!userRole || !roles.includes(userRole)) {
                return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
            }
            
            next();
        } catch (error) {
            res.status(403).json({ success: false, message: 'Forbidden' });
        }
    };
};

module.exports = {
    validateJWT,
    validateRole
};
