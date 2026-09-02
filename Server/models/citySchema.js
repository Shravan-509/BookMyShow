const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
    {
        cityCode: {
            type: String,
            trim: true,
            uppercase: true,
            match: [/^[A-Z]{2,5}$/, "City code must be 2-5 uppercase letters"],
        },
        cityName: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        tier: {
            type: String,
            enum: ["TIER_1", "TIER_2", "TIER_3"],
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
            },
            coordinates: {
                type: [Number],
                default: undefined,
                validate: {
                    validator(coordinates) {
                        if (!coordinates || coordinates.length === 0) {
                            return true;
                        }

                        if (coordinates.length !== 2) {
                            return false;
                        }

                        const [longitude, latitude] = coordinates;
                        return longitude >= -180 && longitude <= 180
                            && latitude >= -90 && latitude <= 90;
                    },
                    message: "Coordinates must be [longitude, latitude] within valid ranges",
                },
            },
        },
    },
    { timestamps: true }
);

citySchema.index({ cityName: 1, state: 1, country: 1 }, { unique: true });
citySchema.index({ cityCode: 1 }, { unique: true, sparse: true });
citySchema.index({ location: "2dsphere" });

const City = mongoose.model("City", citySchema);
module.exports = City;
