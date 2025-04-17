
require("dotenv").config();
const express = require("express");
const connectDB = require('./config/db');
const userRoute = require('./routes/userRoute');
const errorHandler = require('./middlewares/errorHandler');

const PORT = process.env.PORT;

const app = express();
app.use(express.json());
connectDB();
app.use("/bms/v1/users", userRoute);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})