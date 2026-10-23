import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadProfilePhoto } from "../middlewares/upload.middleware";

const router = Router();

router.get("/get-me", UserController.getMe);
router.get("/profile", authMiddleware, UserController.getProfile);
router.put("/profile", authMiddleware, uploadProfilePhoto.single("profile_photo"), UserController.updateProfile);

// 2FA Routes
router.get("/2fa", authMiddleware, UserController.get2FaSettings);
router.post("/2fa/authenticator/setup", authMiddleware, UserController.setupAuthenticator);
router.post("/2fa/authenticator/verify", authMiddleware, UserController.verifyAuthenticatorSetup);
router.post("/2fa/update-method", authMiddleware, UserController.update2FaMethod);
router.post("/2fa/authenticator/disable", authMiddleware, UserController.disableAuthenticator);

export default router;
