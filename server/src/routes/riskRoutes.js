import express from "express";
import { analyzeRisk } from "../controllers/riskController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/analyze", authMiddleware, analyzeRisk);

export default router;
