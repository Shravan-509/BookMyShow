const City = require("../models/citySchema");

const createCity = (payload) => City.create(payload);

const findById = (id) => City.findById(id);

const findActiveById = (id) => City.findOne({ _id: id, isActive: true });

const findDuplicate = ({ cityCode, cityName, state, country, excludeId }) => {
    const duplicateConditions = [
        { cityName, state, country },
    ];

    if (cityCode) {
        duplicateConditions.push({ cityCode });
    }

    const query = { $or: duplicateConditions };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    return City.findOne(query);
};

const findCities = ({ includeInactive = false } = {}) => {
    const query = includeInactive ? {} : { isActive: true };
    return City.find(query).sort({ cityName: 1, state: 1, country: 1 });
};

const updateCity = (id, payload) => City.findByIdAndUpdate(
    id,
    payload,
    {
        returnDocument: "after",
        runValidators: true,
    }
);

module.exports = {
    createCity,
    findById,
    findActiveById,
    findDuplicate,
    findCities,
    updateCity,
};
