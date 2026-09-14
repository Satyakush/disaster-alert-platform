import express from "express";
import {
  createAlert,
  getAllAlerts,
  updateAlert,
  updateAlertStatus,
  deleteAlert,
} from "../controllers/alertController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.get("/", getAllAlerts);
router.post("/", authMiddleware, adminMiddleware, createAlert);
router.put("/:id", authMiddleware, adminMiddleware, updateAlert);
router.patch("/:id/status", authMiddleware, adminMiddleware, updateAlertStatus);
router.delete("/:id", authMiddleware, adminMiddleware, deleteAlert);

export default router;
