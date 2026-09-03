const mongoose = require("mongoose");

const positiveIntegerValidator = {
    validator(value) {
        return Number.isInteger(value) && value > 0;
    },
    message: "{PATH} must be a positive integer",
};

const screenSchema = new mongoose.Schema(
    {
        theatre: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "theatres",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        screenNumber: {
            type: Number,
            required: true,
            validate: positiveIntegerValidator,
        },
        capacity: {
            type: Number,
            required: true,
            validate: positiveIntegerValidator,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

screenSchema.index({ theatre: 1, screenNumber: 1 }, { unique: true });

const Screen = mongoose.model("Screen", screenSchema);
module.exports = Screen;
