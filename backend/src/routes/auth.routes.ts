import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { uploadProfilePhoto } from "../middlewares/upload.middleware";

const router = Router();

router.post("/register", uploadProfilePhoto.single("profile_photo"), AuthController.register);
router.post("/login", AuthController.login);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/resend-otp", AuthController.resendOtp);
router.post("/switch-2fa", AuthController.switchLogin2faMethod);
router.post("/logout", AuthController.logout);

// Forgot Password routes
router.post("/forgot-password/send-otp", AuthController.forgotPasswordSendOtp);
router.post("/forgot-password/verify-otp", AuthController.forgotPasswordVerifyOtp);
router.post("/forgot-password/resend-otp", AuthController.forgotPasswordResendOtp);
router.post("/forgot-password/reset-password", AuthController.forgotPasswordReset);

export default router;
