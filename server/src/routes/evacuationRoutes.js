import express from "express";
import { getEvacuationGuidance, getNearestShelters } from "../controllers/evacuationController.js";

const router = express.Router();

router.get("/nearest-shelters", getNearestShelters);
router.get("/guidance", getEvacuationGuidance);

export default router;
