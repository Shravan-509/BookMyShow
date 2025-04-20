const { registerUser, loginUser, userInfo, deleteUser } = require("../controllers/UserController");
const { validateJWT } = require("../middlewares/authorization");
const router = require("express").Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/user", validateJWT, userInfo);
router.delete("/user", deleteUser);

module.exports = router;