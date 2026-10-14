import { Router } from "express";
import { healthCheckController, pingController } from "../controllers/index.js";

const appRoutes = Router();

appRoutes.get("/ping", pingController);
appRoutes.get("/health", healthCheckController);

export default appRoutes;
