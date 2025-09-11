const { addMovie, getMovies, updateMovie, deleteMovie, getMovieById } = require("../controllers/MovieController");
const { cache } = require("../middlewares/cache");

const router = require("express").Router();

router.post("/", addMovie);
router.get("/", cache(60), getMovies);
router.patch("/:id", updateMovie);
router.delete("/:id", deleteMovie);
router.get("/:id", getMovieById)

module.exports = router