import express from "express";
import { getEvacuationGuidance, getNearestShelters } from "../controllers/evacuationController.js";
import { getEvacuationRoute } from "../controllers/evacuationRouteController.js";

const router = express.Router();

router.get("/nearest-shelters", getNearestShelters);
router.get("/guidance", getEvacuationGuidance);
router.get("/route", getEvacuationRoute);

export default router;
