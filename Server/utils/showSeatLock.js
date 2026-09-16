const crypto = require("crypto");

const SHOW_SEAT_LOCK_DURATION_MS = 7 * 60 * 1000;

const generateShowSeatLockToken = () => crypto.randomBytes(32).toString("hex");

const calculateShowSeatLockExpiresAt = (now = new Date()) => (
    new Date(new Date(now).getTime() + SHOW_SEAT_LOCK_DURATION_MS)
);

module.exports = {
    SHOW_SEAT_LOCK_DURATION_MS,
    calculateShowSeatLockExpiresAt,
    generateShowSeatLockToken,
};
