const {
    getSeatById,
    createSeat,
    updateSeat,
    deleteSeat,
} = require("../controllers/SeatController");
const { validateRole } = require("../middlewares/authorization");

const router = require("express").Router();

router.get("/:id", validateRole(["admin", "partner"]), getSeatById);
router.post("/", validateRole(["admin", "partner"]), createSeat);
router.patch("/:id", validateRole(["admin", "partner"]), updateSeat);
router.delete("/:id", validateRole(["admin", "partner"]), deleteSeat);

module.exports = router;
