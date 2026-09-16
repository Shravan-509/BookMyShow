const {
    SHOW_SEAT_LOCK_DURATION_MS,
    calculateShowSeatLockExpiresAt,
    generateShowSeatLockToken,
} = require("../../utils/showSeatLock");

describe("showSeatLock utilities", () => {
    test("uses a centralized seven-minute lock duration", () => {
        const now = new Date("2026-09-16T10:00:00.000Z");

        expect(SHOW_SEAT_LOCK_DURATION_MS).toBe(7 * 60 * 1000);
        expect(calculateShowSeatLockExpiresAt(now)).toEqual(
            new Date("2026-09-16T10:07:00.000Z")
        );
    });

    test("generates cryptographically random lock tokens", () => {
        const token = generateShowSeatLockToken();
        const secondToken = generateShowSeatLockToken();

        expect(token).toMatch(/^[a-f0-9]{64}$/);
        expect(secondToken).toMatch(/^[a-f0-9]{64}$/);
        expect(secondToken).not.toBe(token);
    });
});
