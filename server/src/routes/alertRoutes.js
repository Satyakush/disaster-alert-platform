import express from "express";
import { createAlert, getAllAlerts, } from "../controllers/alertController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.get("/", getAllAlerts);

// Admin-only: Create alert
router.post("/", authMiddleware, adminMiddleware, createAlert);

export default router;

