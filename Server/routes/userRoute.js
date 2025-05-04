const { userInfo, deleteUser, logoutUser } = require("../controllers/UserController");
const router = require("express").Router();

router.get("/", userInfo);
router.delete("/", deleteUser);
router.post("/logout", logoutUser);

module.exports = router;