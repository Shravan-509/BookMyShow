const { addMovie, getMovies, updateMovie, deleteMovie, getMovieById } = require("../controllers/MovieController");
const { cache } = require("../middlewares/cache");
const { validateRole } = require("../middlewares/authorization");

const router = require("express").Router();

router.post("/", validateRole(["admin"]), addMovie);
router.get("/", cache(60), getMovies);
router.patch("/:id", validateRole(["admin"]), updateMovie);
router.delete("/:id", validateRole(["admin"]), deleteMovie);
router.get("/:id", getMovieById)

module.exports = router
