import { Router } from "express";
import { ContactController } from "../controllers/contact.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadProfilePhoto } from "../middlewares/upload.middleware";

const router = Router();

router.get("/", authMiddleware, ContactController.getAll);
router.get("", authMiddleware, ContactController.getAll);
router.get("/list", authMiddleware, ContactController.getList);
router.get("/:id", authMiddleware, ContactController.getById);
router.post(
  "/",
  authMiddleware,
  uploadProfilePhoto.single("profile_photo"),
  ContactController.create
);
router.put(
  "/:id",
  authMiddleware,
  uploadProfilePhoto.single("profile_photo"),
  ContactController.update
);
router.post("/:id/delete", authMiddleware, ContactController.delete);
router.delete("/:id", authMiddleware, ContactController.delete);
router.patch("/:id/favorite", authMiddleware, ContactController.toggleFavorite);
router.post("/:id/favorite", authMiddleware, ContactController.toggleFavorite);
router.put("/:id/favorite", authMiddleware, ContactController.toggleFavorite);

export default router;
