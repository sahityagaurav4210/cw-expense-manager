import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", CategoryController.getAll);
router.post("/", authMiddleware, CategoryController.create);
router.patch("/:id/toggle", authMiddleware, CategoryController.toggleActive);
router.post("/:id/delete", authMiddleware, CategoryController.delete);

export default router;
