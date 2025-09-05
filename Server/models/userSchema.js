const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name:
        {
            type: String,
            required: true
        },
        email:
        {
            type: String,
            required: true,
            unique: true,
        },
        phone:
        {
            type: Number,
            required: true,
            unique: true,
        },
        password:
        {
            type: String,
            required: true
        },
        /*  
            admin - bookmyshow onboarding of theatre and movies
            partner - They will decide when to run, how to run and cost of tickets
            user - Who will book the tickets
        */
        role:
        {
            type: String,
            enum: ["admin", "partner", "user"],
            required: true,
            default: "user"
        },
        emailVerified :
        {
            type: Boolean,
            default: false
        },
        twoFactorEnabled:
        {
            type: Boolean,
            default: true
        },
        resetToken: {
            type: String
        },
        resetTokenExpiry:{
            type: Date
        },
        // Add tokenVersion to invalidate all existing tokens
        tokenVersion: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps : true
    }
);

const User = mongoose.model("users", userSchema);
module.exports = User;