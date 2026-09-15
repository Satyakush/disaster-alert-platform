import express from "express";
import { getAnalyticsOverview } from "../controllers/analyticsController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/overview", authMiddleware, getAnalyticsOverview);

export default router;
