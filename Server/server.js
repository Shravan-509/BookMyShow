
require("dotenv").config();
const express = require("express");
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const movieRoute = require("./routes/movieRoute");
const theatreRoute = require("./routes/theatreRoute");
const showRoute = require("./routes/showRoute");
const bookingRoute = require("./routes/bookingRoute");
const errorHandler = require('./middlewares/errorHandler');
const { validateJWT } = require("./middlewares/authorization");


const app = express();

const isProd = process.env.NODE_ENV === "production";

//Rate limiter
const limiter = rateLimit({
    windowMs: isProd ? 60 * 60 * 1000 : 15 * 60 * 1000, // 1 hour in prod, 15 min in dev
    max : isProd ? 100 : 1000, // Limit each IP to 100 requests in Prod and 1000 in Dev
    message: "Too many requests from this IP, please try again later",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers

})

app.use(express.json());
app.use(cookieParser());
connectDB();

app.use(cors({
    origin: process.env.PUBLIC_APP_URL,
    credentials: true
}));

app.use(limiter);
app.use("/bms/v1/auth", authRoute);
app.use("/bms/v1/users", validateJWT, userRoute);
app.use("/bms/v1/movies", validateJWT, movieRoute);
app.use("/bms/v1/theatres", validateJWT, theatreRoute);
app.use("/bms/v1/shows", validateJWT, showRoute);
app.use("/bms/v1/bookings", validateJWT, bookingRoute);

app.use(errorHandler);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on ${process.env.PORT}`)
})