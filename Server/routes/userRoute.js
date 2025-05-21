const { userInfo, deleteUser } = require("../controllers/UserController");
const router = require("express").Router();

router.get("/profile", userInfo);
router.delete("/", deleteUser);

module.exports = router;