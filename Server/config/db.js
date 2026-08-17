const mongoose = require("mongoose");

const connectDB = async () => {
    try
    {
        await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log("MongoDB Connection Successful")
    }
    catch(error)
    {
        console.error("MongoDB Connection Error:", error.message);
        process.exit(1);
    }
}

module.exports = connectDB;
