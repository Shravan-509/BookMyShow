const mongoose = require("mongoose");
const cityRepository = require("../repositories/cityRepository");
const AppError = require("../utils/AppError");

const CITY_CODE_PATTERN = /^[A-Z]{2,5}$/;
const CITY_TIERS = new Set(["TIER_1", "TIER_2", "TIER_3"]);

const sanitizeLocation = (location) => {
    if (!location || (!location.type && !location.coordinates)) {
        return undefined;
    }

    const coordinates = Array.isArray(location.coordinates)
        ? location.coordinates.map((coordinate) => Number(coordinate))
        : [];

    return {
        type: location.type || "Point",
        coordinates,
    };
};

const sanitizeCityPayload = (payload = {}) => {
    const cityCode = payload.cityCode?.trim().toUpperCase();
    const tier = payload.tier?.trim?.() || payload.tier;

    return {
        cityCode: cityCode || undefined,
        cityName: payload.cityName?.trim(),
        state: payload.state?.trim(),
        country: payload.country?.trim(),
        isActive: payload.isActive,
        tier: tier || undefined,
        location: sanitizeLocation(payload.location),
    };
};

const validateRequiredCityFields = ({ cityName, state, country }) => {
    if (!cityName || !state || !country) {
        throw new AppError("City name, state, and country are required", 400, "CITY_VALIDATION_ERROR");
    }
};

const validateCityMetadata = ({ cityCode, tier, location }) => {
    if (cityCode && !CITY_CODE_PATTERN.test(cityCode)) {
        throw new AppError("City code must be 2-5 uppercase letters", 400, "INVALID_CITY_CODE");
    }

    if (tier && !CITY_TIERS.has(tier)) {
        throw new AppError("City tier must be TIER_1, TIER_2, or TIER_3", 400, "INVALID_CITY_TIER");
    }

    if (!location) {
        return;
    }

    if (location.type !== "Point") {
        throw new AppError("City location must use GeoJSON Point type", 400, "INVALID_CITY_LOCATION");
    }

    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        throw new AppError("City coordinates must be [longitude, latitude]", 400, "INVALID_CITY_LOCATION");
    }

    const [longitude, latitude] = location.coordinates;
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180
        || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        throw new AppError("City coordinates must be within valid longitude and latitude ranges", 400, "INVALID_CITY_LOCATION");
    }
};

const ensureValidObjectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid city identifier", 400, "INVALID_CITY_ID");
    }
};

const handleDuplicateCity = (error) => {
    if (error?.code === 11000) {
        const duplicateCode = error.keyPattern?.cityCode ? "DUPLICATE_CITY_CODE" : "DUPLICATE_CITY";
        throw new AppError("City already exists", 409, duplicateCode);
    }

    throw error;
};

const getCities = ({ includeInactive = false } = {}) => (
    cityRepository.findCities({ includeInactive })
);

const getCityById = async (id) => {
    ensureValidObjectId(id);

    const city = await cityRepository.findById(id);
    if (!city) {
        throw new AppError("City not found", 404, "CITY_NOT_FOUND");
    }

    return city;
};

const createCity = async (payload) => {
    const cityPayload = sanitizeCityPayload(payload);
    validateRequiredCityFields(cityPayload);
    validateCityMetadata(cityPayload);

    const duplicate = await cityRepository.findDuplicate(cityPayload);
    if (duplicate) {
        const duplicateCode = cityPayload.cityCode && duplicate.cityCode === cityPayload.cityCode
            ? "DUPLICATE_CITY_CODE"
            : "DUPLICATE_CITY";
        throw new AppError("City already exists", 409, duplicateCode);
    }

    try {
        return await cityRepository.createCity(cityPayload);
    } catch (error) {
        handleDuplicateCity(error);
    }
};

const updateCity = async (id, payload) => {
    ensureValidObjectId(id);

    const existingCity = await cityRepository.findById(id);
    if (!existingCity) {
        throw new AppError("City not found", 404, "CITY_NOT_FOUND");
    }

    const cityPayload = sanitizeCityPayload({
        cityCode: payload.cityCode ?? existingCity.cityCode,
        cityName: payload.cityName ?? existingCity.cityName,
        state: payload.state ?? existingCity.state,
        country: payload.country ?? existingCity.country,
        isActive: payload.isActive ?? existingCity.isActive,
        tier: payload.tier ?? existingCity.tier,
        location: payload.location ?? existingCity.location,
    });
    validateRequiredCityFields(cityPayload);
    validateCityMetadata(cityPayload);

    const duplicate = await cityRepository.findDuplicate({ ...cityPayload, excludeId: id });
    if (duplicate) {
        const duplicateCode = cityPayload.cityCode && duplicate.cityCode === cityPayload.cityCode
            ? "DUPLICATE_CITY_CODE"
            : "DUPLICATE_CITY";
        throw new AppError("City already exists", 409, duplicateCode);
    }

    try {
        return await cityRepository.updateCity(id, cityPayload);
    } catch (error) {
        handleDuplicateCity(error);
    }
};

const deactivateCity = async (id) => {
    ensureValidObjectId(id);

    const city = await cityRepository.updateCity(id, { isActive: false });
    if (!city) {
        throw new AppError("City not found", 404, "CITY_NOT_FOUND");
    }

    return city;
};

const ensureActiveCity = async (id) => {
    if (!id) {
        return null;
    }

    ensureValidObjectId(id);

    const city = await cityRepository.findActiveById(id);
    if (!city) {
        throw new AppError("City must reference an active city", 400, "INVALID_CITY_REFERENCE");
    }

    return city;
};

module.exports = {
    CITY_CODE_PATTERN,
    CITY_TIERS,
    getCities,
    getCityById,
    createCity,
    updateCity,
    deactivateCity,
    ensureActiveCity,
};
