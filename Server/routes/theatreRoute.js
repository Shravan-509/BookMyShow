const { getTheatres, addTheatre, updateTheatre, deleteTheatre, getTheatresByOwner } = require("../controllers/TheatreController");

const router = require("express").Router();

// router.get("/", getTheatres);
router.post("/", addTheatre);
router.patch("/:id", updateTheatre);
router.delete("/:id", deleteTheatre);
router.get("/", getTheatresByOwner);

module.exports = router;