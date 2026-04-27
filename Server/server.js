require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/db");

const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const movieRoute = require("./routes/movieRoute");
const theatreRoute = require("./routes/theatreRoute");
const showRoute = require("./routes/showRoute");
const bookingRoute = require("./routes/bookingRoute");

const errorHandler = require("./middlewares/errorHandler");
const { validateJWT } = require("./middlewares/authorization");
const performanceOptimization = require("./middlewares/performanceOptimization");

const app = express();
const isProd = process.env.NODE_ENV === "production";

// ✅ Required for correct IP detection (important for rate limiting)
app.set("trust proxy", 1);

// ------------------ CORE MIDDLEWARE ------------------

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// Mongo sanitize (prevent NoSQL injection)
app.use(mongoSanitize());

// Fix req.query mutability (optional but fine)
// app.use((req, _res, next) => {
//   Object.defineProperty(req, "query", {
//     ...Object.getOwnPropertyDescriptor(req, "query"),
//     value: req.query,
//     writable: true,
//   });
//   next();
// });

// ------------------ PERFORMANCE & SECURITY ------------------

// Use centralized performance middleware
app.use(performanceOptimization.securityHeaders);
app.use(performanceOptimization.compressionMiddleware);
app.use(performanceOptimization.responseTimeMiddleware);
app.use(performanceOptimization.requestLogger);
app.use(performanceOptimization.staticCacheHeaders);

// Global rate limiter
app.use(performanceOptimization.generalLimiter);

// ------------------ CORS ------------------

app.use(
  cors({
    origin: process.env.PUBLIC_APP_URL,
    credentials: true,
  })
);

// ------------------ DATABASE ------------------

connectDB();

// ------------------ ROUTES ------------------

// Public routes
app.use(
  "/bms/v1/auth",
  performanceOptimization.authLimiter, // stricter limit
  authRoute
);

// Protected routes
app.use("/bms/v1/users", validateJWT, userRoute);
app.use("/bms/v1/movies", validateJWT, movieRoute);
app.use("/bms/v1/theatres", validateJWT, theatreRoute);
app.use("/bms/v1/shows", validateJWT, showRoute);

// Booking route with stricter limiter
app.use(
  "/bms/v1/bookings",
  validateJWT,
  performanceOptimization.bookingLimiter,
  bookingRoute
);

// ------------------ ERROR HANDLING ------------------

app.use(errorHandler);

// ------------------ START SERVER ------------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});