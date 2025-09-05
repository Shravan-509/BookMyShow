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
            enum: ["email", "2fa", "reverify", "email-change"],
            required: true
        },
         metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
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

const Verification = mongoose.model("verification", verificationSchema);
module.exports = Verification;