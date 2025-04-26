const { addMovie, getMovies, updateMovie, deleteMovie } = require("../controllers/MovieController");

const router = require("express").Router();

router.post("/", addMovie);
router.get("/", getMovies);
router.patch("/:id", updateMovie);
router.delete("/:id", deleteMovie);


module.exports = router