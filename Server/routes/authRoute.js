const { register, login, verifyEmail, resendVerification, verify2FA, resend2FA, reverifyEmail} = require("../controllers/AuthController");
const router = require("express").Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/request-reverification", reverifyEmail)

router.post("/login", login);
router.post("/verify-2fa", verify2FA);
router.post("/resend-2fa", resend2FA);


module.exports = router;