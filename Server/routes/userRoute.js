const { registerUser, loginUser, userInfo, deleteUser } = require("../controllers/UserController");
const router = require("express").Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/user", userInfo);
router.delete("/user", deleteUser);

module.exports = router;