const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
    {
        userId:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true
        },
        code:
        {
            type: String,
            required: true
        },
        type:
        {
            type: String,
            enum: ["email", "2fa", "reverify"],
            required: true
        },
        expiresAt:
        {
            type: Date,
            required: true
        }
    },
    {
        timestamps : true
    }
);

module.exports = mongoose.model("verification", verificationSchema);