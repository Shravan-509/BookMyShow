const { addShow, deleteShow, updateShow, getShowById, getAllShowsByTheatre, getTheatresWithShowsByMovie } = require("../controllers/ShowController");
const { cache } = require("../middlewares/cache");
const { validateRole } = require("../middlewares/authorization");

const router = require("express").Router();

router.post("/", validateRole(["admin", "partner"]), addShow);
router.delete("/:id", validateRole(["admin", "partner"]), deleteShow);
router.patch("/:id", validateRole(["admin", "partner"]), updateShow);
router.get("/:id", cache(30), getShowById);
router.get("/theatre/:id", validateRole(["admin", "partner"]), getAllShowsByTheatre);
router.post("/theatres/movie", getTheatresWithShowsByMovie)

// getShows()
module.exports = router;
