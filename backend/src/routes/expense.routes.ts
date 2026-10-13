import { Router } from "express";
import { ExpenseController } from "../controllers/expense.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadBill, uploadBulkTemplate } from "../middlewares/upload.middleware";

const router = Router();

router.post("/", authMiddleware, uploadBill.single("bill"), ExpenseController.create);
router.post("/bulk", authMiddleware, uploadBulkTemplate.any(), ExpenseController.bulkCreate);
router.post("/bulk-create", authMiddleware, uploadBulkTemplate.any(), ExpenseController.bulkCreate);
router.post("/bulk-upload", authMiddleware, uploadBulkTemplate.any(), ExpenseController.bulkCreate);
router.get("/template", ExpenseController.downloadBulkTemplate);
router.get("/bulk-template", ExpenseController.downloadBulkTemplate);
router.get("/", authMiddleware, ExpenseController.getAll);
router.get("/:id/bill", authMiddleware, ExpenseController.downloadBill);
router.post("/:id/bill", authMiddleware, uploadBill.single("bill"), ExpenseController.uploadBill);
router.post("/:id/delete", authMiddleware, ExpenseController.delete);
router.delete("/:id", authMiddleware, ExpenseController.delete);

export default router;

