
require("dotenv").config();
const express = require("express");
const connectDB = require('./config/db');
const userRoute = require('./routes/userRoute');
const movieRoute = require("./routes/movieRoute");
const theatreRoute = require("./routes/theatreRoute");
const errorHandler = require('./middlewares/errorHandler');

const { validateJWT } = require("./middlewares/authorization");

const PORT = process.env.PORT;

const app = express();
app.use(express.json());
connectDB();
app.use("/bms/v1/users", userRoute);
app.use("/bms/v1/movies", validateJWT, movieRoute);
app.use("/bms/v1/theatres", validateJWT, theatreRoute)

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})