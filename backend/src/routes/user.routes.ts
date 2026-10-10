import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadProfilePhoto } from "../middlewares/upload.middleware";

const router = Router();

router.get("/profile", authMiddleware, UserController.getProfile);
router.put("/profile", authMiddleware, uploadProfilePhoto.single("profile_photo"), UserController.updateProfile);

export default router;
