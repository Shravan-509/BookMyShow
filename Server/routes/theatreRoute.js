const { getTheatres, addTheatre, updateTheatre, deleteTheatre } = require("../controllers/TheatreController");

const router = require("express").Router();

router.post("/", addTheatre);
router.patch("/:id", updateTheatre);
router.delete("/:id", deleteTheatre);
router.get("/", getTheatres);

module.exports = router;