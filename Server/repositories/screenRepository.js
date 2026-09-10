const Screen = require("../models/screenSchema");

const createScreen = (payload) => Screen.create(payload);

const findById = (id, options = {}) => Screen.findById(id, null, options);

const findActiveById = (id, options = {}) => Screen.findOne({ _id: id, isActive: true }, null, options);

const findScreens = () => Screen.find({})
    .populate("theatre", "name address city owner isActive")
    .sort({ theatre: 1, screenNumber: 1 });

const findByTheatre = (theatreId, { activeOnly = false } = {}) => {
    const query = { theatre: theatreId };
    if (activeOnly) {
        query.isActive = true;
    }

    return Screen.find(query).sort({ screenNumber: 1 });
};

const findByTheatres = (theatreIds) => Screen.find({ theatre: { $in: theatreIds } })
    .populate("theatre", "name address city owner isActive")
    .sort({ theatre: 1, screenNumber: 1 });

const findDuplicateScreenNumber = ({ theatre, screenNumber, excludeId }) => {
    const query = { theatre, screenNumber };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    return Screen.findOne(query);
};

const updateScreen = (id, payload) => Screen.findByIdAndUpdate(
    id,
    payload,
    {
        returnDocument: "after",
        runValidators: true,
    }
);

const deleteScreen = (id) => Screen.findByIdAndDelete(id);

module.exports = {
    createScreen,
    findById,
    findActiveById,
    findScreens,
    findByTheatre,
    findByTheatres,
    findDuplicateScreenNumber,
    updateScreen,
    deleteScreen,
};
