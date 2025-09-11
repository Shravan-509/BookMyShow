const { addShow, deleteShow, updateShow, getShowById, getAllShowsByTheatre, getTheatresWithShowsByMovie } = require("../controllers/ShowController");
const { cache } = require("../middlewares/cache");

const router = require("express").Router();

router.post("/", addShow);
router.delete("/:id", deleteShow);
router.patch("/:id", updateShow);
router.get("/:id", cache(30), getShowById);
router.get("/theatre/:id", cache(30), getAllShowsByTheatre);
router.post("/theatres/movie", getTheatresWithShowsByMovie)

module.exports = router;
