import express from "express";
import {
  createIncidentReport,
  getIncidentReports,
  updateIncidentReportStatus,
} from "../controllers/incidentReportController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.get("/", getIncidentReports);
router.post("/", authMiddleware, createIncidentReport);
router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  updateIncidentReportStatus
);

export default router;
