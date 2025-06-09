const { addMovie, getMovies, updateMovie, deleteMovie, getMovieById } = require("../controllers/MovieController");

const router = require("express").Router();

router.post("/", addMovie);
router.get("/", getMovies);
router.patch("/:id", updateMovie);
router.delete("/:id", deleteMovie);
router.get("/:id", getMovieById)


module.exports = router