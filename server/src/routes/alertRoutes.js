import express from "express";
import { createAlert, getAllAlerts, updateAlert,deleteAlert,} from "../controllers/alertController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.get("/", getAllAlerts);

// Admin-only: Create alert
router.post("/", authMiddleware, adminMiddleware, createAlert);

// Update alert (Admin)
 router.put("/:id", authMiddleware, adminMiddleware, updateAlert);

// Delete alert (Admin)
router.delete("/:id", authMiddleware, adminMiddleware, deleteAlert);

export default router;

