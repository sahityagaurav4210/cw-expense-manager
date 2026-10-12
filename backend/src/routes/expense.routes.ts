import { Router } from "express";
import { ExpenseController } from "../controllers/expense.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadBill } from "../middlewares/upload.middleware";

const router = Router();

router.post("/", authMiddleware, uploadBill.single("bill"), ExpenseController.create);
router.get("/", authMiddleware, ExpenseController.getAll);
router.get("/:id/bill", authMiddleware, ExpenseController.downloadBill);
router.post("/:id/bill", authMiddleware, uploadBill.single("bill"), ExpenseController.uploadBill);
router.post("/:id/delete", authMiddleware, ExpenseController.delete);

export default router;
