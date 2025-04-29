const { addShow, deleteShow, updateShow, getShowById, getAllShowsByTheatre, getAllTheatresByMovie } = require("../controllers/ShowController");

const router = require("express").Router();

router.post("/", addShow);
router.delete("/:id", deleteShow);
router.patch("/:id", updateShow);
router.get("/:id", getShowById);
router.get("/theatre/:id", getAllShowsByTheatre);
router.post("/theatres/movie", getAllTheatresByMovie)

module.exports = router;
