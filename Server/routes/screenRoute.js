const {
    getScreens,
    getScreenById,
    createScreen,
    updateScreen,
    deleteScreen,
} = require("../controllers/ScreenController");
const { validateRole } = require("../middlewares/authorization");

const router = require("express").Router();

router.get("/", validateRole(["admin", "partner"]), getScreens);
router.get("/:id", validateRole(["admin", "partner"]), getScreenById);
router.post("/", validateRole(["admin", "partner"]), createScreen);
router.patch("/:id", validateRole(["admin", "partner"]), updateScreen);
router.delete("/:id", validateRole(["admin", "partner"]), deleteScreen);

module.exports = router;
