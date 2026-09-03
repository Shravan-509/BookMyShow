const { getTheatres, addTheatre, updateTheatre, deleteTheatre } = require("../controllers/TheatreController");
const { getScreensByTheatre } = require("../controllers/ScreenController");
const { validateRole } = require("../middlewares/authorization");

const router = require("express").Router();

router.post("/", validateRole(["admin", "partner"]), addTheatre);
router.patch("/:id", validateRole(["admin", "partner"]), updateTheatre);
router.delete("/:id", validateRole(["admin", "partner"]), deleteTheatre);
router.get("/", validateRole(["admin", "partner"]), getTheatres);
router.get("/:theatreId/screens", validateRole(["admin", "partner"]), getScreensByTheatre);

// getTheatreById()
// getTheatresByCity(/city/:city)

module.exports = router;
