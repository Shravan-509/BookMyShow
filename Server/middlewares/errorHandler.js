const AppError = require("../utils/AppError");

const DEFAULT_ERROR = {
    statusCode: 500,
    message: "Internal server error",
    code: "INTERNAL_ERROR",
};

const isHttpStatus = (statusCode) => Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600;

const isRazorpayError = (err) => Boolean(
    err?.error
    || err?.name === "RazorpayError"
    || String(err?.message || "").toLowerCase().includes("razorpay")
);

const duplicateKeyResponse = (err) => {
    const duplicateFields = Object.keys(err.keyPattern || err.keyValue || {});

    if (duplicateFields.includes("transactionId") || duplicateFields.includes("orderId")) {
        return {
            statusCode: 409,
            message: "Payment has already been used for a booking",
            code: "PAYMENT_REPLAY",
        };
    }

    return {
        statusCode: 409,
        message: "Duplicate resource already exists",
        code: "DUPLICATE_RESOURCE",
    };
};

const normalizeError = (err, responseStatusCode) => {
    if (err instanceof AppError || err?.isOperational) {
        return {
            statusCode: isHttpStatus(err.statusCode) ? err.statusCode : DEFAULT_ERROR.statusCode,
            message: err.message || DEFAULT_ERROR.message,
            code: err.code,
        };
    }

    if (err?.name === "ValidationError") {
        const validationMessages = Object.values(err.errors || {})
            .map((validationError) => validationError.message)
            .filter(Boolean);

        return {
            statusCode: 400,
            message: validationMessages[0] || "Invalid request data",
            code: "VALIDATION_ERROR",
        };
    }

    if (err?.name === "CastError") {
        return {
            statusCode: 400,
            message: "Invalid resource identifier",
            code: "INVALID_ID",
        };
    }

    if (err?.code === 11000) {
        return duplicateKeyResponse(err);
    }

    if (
        String(err?.name || "").startsWith("Mongoose")
        || err?.name === "MongoServerError"
        || err?.name === "MongoNetworkError"
    ) {
        return DEFAULT_ERROR;
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return {
            statusCode: 400,
            message: "Invalid JSON payload",
            code: "INVALID_JSON",
        };
    }

    if (err?.name === "TokenExpiredError") {
        return {
            statusCode: 401,
            message: "Token expired",
            code: "TOKEN_EXPIRED",
        };
    }

    if (err?.name === "JsonWebTokenError") {
        return {
            statusCode: 401,
            message: "Invalid token",
            code: "INVALID_TOKEN",
        };
    }

    if (isRazorpayError(err)) {
        return {
            statusCode: isHttpStatus(responseStatusCode) ? responseStatusCode : 400,
            message: "Payment gateway request failed",
            code: "PAYMENT_GATEWAY_ERROR",
        };
    }

    if (isHttpStatus(responseStatusCode) && responseStatusCode < 500) {
        return {
            statusCode: responseStatusCode,
            message: "Invalid request",
            code: err?.code,
        };
    }

    return DEFAULT_ERROR;
};

const logError = (err, req, normalizedError) => {
    const isProd = process.env.NODE_ENV === "production";
    const logPrefix = `[error] ${req.method} ${req.originalUrl} ${normalizedError.statusCode}`;

    if (isProd) {
        console.error(`${logPrefix} ${normalizedError.code || "ERROR"}`);
        return;
    }

    console.error(logPrefix, {
        message: err?.message || normalizedError.message,
        code: normalizedError.code,
        stack: err?.stack,
    });
};

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const normalizedError = normalizeError(err, res.statusCode);

    if (normalizedError.statusCode >= 500) {
        logError(err, req, normalizedError);
    }

    const responseBody = {
        success: false,
        message: normalizedError.message,
    };

    if (normalizedError.code) {
        responseBody.code = normalizedError.code;
    }

    return res.status(normalizedError.statusCode).json(responseBody);
};

module.exports = errorHandler;
