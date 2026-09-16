const mongoose = require("mongoose");
const ShowSeat = require("../models/showSeatSchema");

const { SHOW_SEAT_STATUS } = ShowSeat;

class ShowSeatLockConflictError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = "ShowSeatLockConflictError";
        this.code = "SEAT_LOCK_CONFLICT";
        this.details = details;
        this.isOperational = true;
        this.statusCode = 409;
    }
}

const normalizeSeatNumber = (seatNumber) => (
    typeof seatNumber === "string" ? seatNumber.trim().toUpperCase() : seatNumber
);

const normalizeSeatNumbers = (seatNumbers = []) => seatNumbers.map(normalizeSeatNumber);

const getQueryOptions = (options = {}) => {
    const { now, ...queryOptions } = options;
    return queryOptions;
};

const findByShow = (showId, options = {}) => (
    ShowSeat.find({ show: showId }, null, options).sort({ row: 1, column: 1 })
);

const findAvailabilityByShow = (showId, options = {}) => (
    ShowSeat.find(
        { show: showId },
        "_id seat seatNumber row column seatType status lockExpiresAt",
        getQueryOptions(options)
    ).lean()
);

const findByShowAndStatus = (showId, status, options = {}) => (
    ShowSeat.find({ show: showId, status }, null, options).sort({ row: 1, column: 1 })
);

const countByShow = (showId, options = {}) => (
    ShowSeat.countDocuments({ show: showId }, options)
);

const findByShowAndSeat = (showId, seatId, options = {}) => (
    ShowSeat.findOne({ show: showId, seat: seatId }, null, options)
);

const findByShowAndSeatNumbers = (showId, seatNumbers, options = {}) => (
    ShowSeat.find(
        { show: showId, seatNumber: { $in: normalizeSeatNumbers(seatNumbers) } },
        null,
        options
    )
);

const markSeatsBooked = ({ showId, seatNumbers, bookingId, bookedAt }, options = {}) => (
    ShowSeat.updateMany(
        {
            show: showId,
            seatNumber: { $in: normalizeSeatNumbers(seatNumbers) },
            status: SHOW_SEAT_STATUS.AVAILABLE,
        },
        {
            $set: {
                status: SHOW_SEAT_STATUS.BOOKED,
                booking: bookingId,
                bookedAt,
            },
        },
        options
    )
);

const insertMany = (showSeats, options = {}) => (
    ShowSeat.insertMany(showSeats, { ordered: true, ...options })
);

const deleteByShow = (showId, options = {}) => (
    ShowSeat.deleteMany({ show: showId }, options)
);

const findOwnedActiveLocks = ({
    showId,
    seatNumbers,
    userId,
    lockToken,
    now,
}, options = {}) => (
    ShowSeat.find(
        {
            show: showId,
            seatNumber: { $in: normalizeSeatNumbers(seatNumbers) },
            status: SHOW_SEAT_STATUS.LOCKED,
            lockOwner: userId,
            lockToken,
            lockExpiresAt: { $gt: now },
        },
        null,
        options
    )
);

const verifyLockOwnership = async ({
    showId,
    seatNumbers,
    userId,
    lockToken,
    now,
}, options = {}) => {
    const normalizedSeatNumbers = normalizeSeatNumbers(seatNumbers);
    const lockedSeats = await findOwnedActiveLocks({
        showId,
        seatNumbers: normalizedSeatNumbers,
        userId,
        lockToken,
        now,
    }, options);
    const lockedSeatNumbers = new Set(
        lockedSeats.map((showSeat) => normalizeSeatNumber(showSeat.seatNumber))
    );
    const missingSeatNumbers = normalizedSeatNumbers.filter((seatNumber) => (
        !lockedSeatNumbers.has(seatNumber)
    ));

    return {
        verified: missingSeatNumbers.length === 0 && lockedSeats.length === normalizedSeatNumbers.length,
        lockedSeats,
        missingSeatNumbers,
        requestedSeatNumbers: normalizedSeatNumbers,
    };
};

const runInTransaction = async (operation, options = {}) => {
    if (options.session) {
        return operation(options);
    }

    const session = await mongoose.startSession();

    try {
        let result;
        await session.withTransaction(async () => {
            result = await operation({ ...options, session });
        });
        return result;
    } finally {
        await session.endSession();
    }
};

const acquireLocksWithinSession = async ({
    showId,
    seatNumbers,
    userId,
    lockToken,
    now,
    lockExpiresAt,
}, options = {}) => {
    const normalizedSeatNumbers = normalizeSeatNumbers(seatNumbers);
    const updateResult = await ShowSeat.updateMany(
        {
            show: showId,
            seatNumber: { $in: normalizedSeatNumbers },
            status: { $ne: SHOW_SEAT_STATUS.BOOKED },
            $or: [
                { status: SHOW_SEAT_STATUS.AVAILABLE },
                {
                    status: SHOW_SEAT_STATUS.LOCKED,
                    lockExpiresAt: { $lte: now },
                },
                {
                    status: SHOW_SEAT_STATUS.LOCKED,
                    lockOwner: userId,
                    lockToken,
                },
            ],
        },
        {
            $set: {
                status: SHOW_SEAT_STATUS.LOCKED,
                lockOwner: userId,
                lockToken,
                lockedAt: now,
            },
            $max: {
                lockExpiresAt,
            },
            $unset: {
                booking: "",
                bookedAt: "",
            },
        },
        options
    );
    const ownership = await verifyLockOwnership({
        showId,
        seatNumbers: normalizedSeatNumbers,
        userId,
        lockToken,
        now,
    }, options);

    if (!ownership.verified) {
        throw new ShowSeatLockConflictError(
            "Unable to acquire every requested ShowSeat lock",
            {
                requestedSeatNumbers: normalizedSeatNumbers,
                missingSeatNumbers: ownership.missingSeatNumbers,
                updateResult,
            }
        );
    }

    return {
        updateResult,
        ...ownership,
    };
};

const acquireLocks = (lockRequest, options = {}) => (
    runInTransaction(
        (transactionOptions) => acquireLocksWithinSession(lockRequest, transactionOptions),
        options
    )
);

const refreshLocksWithinSession = async ({
    showId,
    seatNumbers,
    userId,
    lockToken,
    now,
    lockExpiresAt,
}, options = {}) => {
    const normalizedSeatNumbers = normalizeSeatNumbers(seatNumbers);
    const updateResult = await ShowSeat.updateMany(
        {
            show: showId,
            seatNumber: { $in: normalizedSeatNumbers },
            status: SHOW_SEAT_STATUS.LOCKED,
            lockOwner: userId,
            lockToken,
            lockExpiresAt: { $gt: now },
        },
        {
            $set: {
                lockExpiresAt,
            },
        },
        options
    );
    const ownership = await verifyLockOwnership({
        showId,
        seatNumbers: normalizedSeatNumbers,
        userId,
        lockToken,
        now,
    }, options);

    if (!ownership.verified) {
        throw new ShowSeatLockConflictError(
            "Unable to refresh every requested ShowSeat lock",
            {
                requestedSeatNumbers: normalizedSeatNumbers,
                missingSeatNumbers: ownership.missingSeatNumbers,
                updateResult,
            }
        );
    }

    return {
        updateResult,
        ...ownership,
    };
};

const refreshLocks = (lockRequest, options = {}) => (
    runInTransaction(
        (transactionOptions) => refreshLocksWithinSession(lockRequest, transactionOptions),
        options
    )
);

const releaseLocks = ({
    showId,
    seatNumbers,
    userId,
    lockToken,
}, options = {}) => (
    ShowSeat.updateMany(
        {
            show: showId,
            seatNumber: { $in: normalizeSeatNumbers(seatNumbers) },
            status: SHOW_SEAT_STATUS.LOCKED,
            lockOwner: userId,
            lockToken,
        },
        {
            $set: {
                status: SHOW_SEAT_STATUS.AVAILABLE,
                lockOwner: null,
                lockToken: null,
                lockedAt: null,
                lockExpiresAt: null,
            },
        },
        options
    )
);

module.exports = {
    ShowSeatLockConflictError,
    acquireLocks,
    findByShow,
    findAvailabilityByShow,
    findByShowAndStatus,
    countByShow,
    findByShowAndSeat,
    findByShowAndSeatNumbers,
    findOwnedActiveLocks,
    markSeatsBooked,
    refreshLocks,
    releaseLocks,
    verifyLockOwnership,
    insertMany,
    deleteByShow,
};
