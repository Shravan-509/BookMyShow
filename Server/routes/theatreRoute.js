const { getTheatres, addTheatre, updateTheatre, deleteTheatre } = require("../controllers/TheatreController");
const { cache } = require("../middlewares/cache");

const router = require("express").Router();

router.post("/", addTheatre);
router.patch("/:id", updateTheatre);
router.delete("/:id", deleteTheatre);
router.get("/", cache(60), getTheatres);

module.exports = router;