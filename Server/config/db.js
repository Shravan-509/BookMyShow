const mongoose = require("mongoose");

const connectDB = async () => {
    try{
        const repsonse = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log("MongoDB Connection Successful")
    }catch(error){
        console.log("MongoDB Connection Error", error);
        process.exit(1);
    }
}

module.exports = connectDB;