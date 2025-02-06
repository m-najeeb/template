const { Router } = require("express");
const userController = require("../controllers/userController");
const verifyToken = require("../../src/middleware/verifyToken");

const router = Router();

router.post("/sign-up", userController.signUp);
router.post("/sign-in", userController.signIn);
router.post("/refreshToken", userController.refreshAccessToken);
router.post("/forgot-Password", userController.forgotPassword);
router.post("/verify-otp", userController.verifyOTP);
router.post("/send-otp", userController.sendOTP);

// Protected routes
router.post(
  "/edit-basic-profile",
  verifyToken,
  userController.editBasicProfile
);
router.post("/change-Password", verifyToken, userController.changePassword);
router.post("/sign-out/:id", verifyToken, userController.signOut);

module.exports = router;
