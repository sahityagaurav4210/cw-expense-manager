import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { uploadProfilePhoto } from "../middlewares/upload.middleware";

const router = Router();

router.post("/register", uploadProfilePhoto.single("profile_photo"), AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

export default router;
