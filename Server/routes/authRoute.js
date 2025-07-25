const { 
    register, 
    login, 
    verifyEmail, 
    resendVerification, 
    verify2FA, 
    resend2FA, 
    reverifyEmail, 
    logoutUser,
    forgotPassword,
    resetPassword
} = require("../controllers/AuthController");
const router = require("express").Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/request-reverification", reverifyEmail)

router.post("/login", login);
router.post("/verify-2fa", verify2FA);
router.post("/resend-2fa", resend2FA);

router.post("/logout", logoutUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


module.exports = router;