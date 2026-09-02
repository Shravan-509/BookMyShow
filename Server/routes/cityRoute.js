const router = require("express").Router();
const {
    getCities,
    getCityById,
    createCity,
    updateCity,
    deactivateCity,
} = require("../controllers/CityController");
const { validateRole } = require("../middlewares/authorization");

router.get("/", getCities);
router.get("/:id", getCityById);
router.post("/", validateRole(["admin"]), createCity);
router.patch("/:id", validateRole(["admin"]), updateCity);
router.delete("/:id", validateRole(["admin"]), deactivateCity);

module.exports = router;
