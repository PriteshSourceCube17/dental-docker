const { authController } = require("../controller");
const { emailPasswordValidation, clinicValidation, authValidation } = require("../middleware/validations");

const router = require("express").Router();

router.post("/admin-signup", emailPasswordValidation, authController.adminSingUp);
router.post("/admin-signIn", emailPasswordValidation, authController.adminSignIn);

// Auth Routes
router.post("/signup", authValidation, authController.Singup);
router.post("/signin",emailPasswordValidation,authController.SignIn);
router.post("/sendOtp",authController.sendOtp);
router.post("/verifyOtp",authController.verifyOtp);
router.post("/forgotPassword",authController.forgotPassword);
router.post("/verifyresetOtp",authController.verifyresetOtp);
router.post("/resetPassword",authController.resetPassword);

module.exports = router;