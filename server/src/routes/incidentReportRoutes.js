import express from "express";
import {
  createIncidentReport,
  getIncidentReports,
  getMyIncidentReports,
  updateIncidentReportStatus,
  convertIncidentReportToAlert,
} from "../controllers/incidentReportController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.get("/", getIncidentReports);
router.get("/mine", authMiddleware, getMyIncidentReports);
router.post("/", authMiddleware, createIncidentReport);
router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  updateIncidentReportStatus
);
router.post(
  "/:id/convert-to-alert",
  authMiddleware,
  adminMiddleware,
  convertIncidentReportToAlert
);

export default router;
