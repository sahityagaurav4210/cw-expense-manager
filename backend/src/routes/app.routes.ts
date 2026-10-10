import { Router } from "express";
import { AppController } from "../controllers/app.controller";

const router = Router();

router.get("/health", AppController.health);

export default router;
