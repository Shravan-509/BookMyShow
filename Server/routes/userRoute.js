
const { userInfo, updateProfile, deleteAccount, changePassword, requestEmailChange, verifyEmailChange, toggle2FA, getAllUsers } = require("../controllers/UserController");
const router = require("express").Router();

router.get("/profile", userInfo);
router.put("/update-profile", updateProfile);
router.put("/change-password", changePassword);
router.post("/request-email-change", requestEmailChange);
router.post("/verify-email-change", verifyEmailChange);
router.put("/toggle-2fa", toggle2FA);
router.delete("/delete-account", deleteAccount);
router.get("/admin/all", getAllUsers)

//GET /reminders
module.exports = router;