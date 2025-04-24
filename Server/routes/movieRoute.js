const { addMovie, getMovies, updateMovie, deleteMovie } = require("../controllers/MovieController");
const { validateJWT } = require("../middlewares/authorization");

const router = require("express").Router();

router.post("/addMovie", validateJWT, addMovie);
router.get("/movie", validateJWT, getMovies);
router.patch("/updateMovie/:id", validateJWT, updateMovie);
router.delete("/deleteMovie/:id", validateJWT, deleteMovie);


module.exports = router