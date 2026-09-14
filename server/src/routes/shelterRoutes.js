import express from "express";
import {
  createShelter,
  deleteShelter,
  getShelters,
  updateShelter,
} from "../controllers/shelterController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.get("/", getShelters);
router.post("/", authMiddleware, adminMiddleware, createShelter);
router.put("/:id", authMiddleware, adminMiddleware, updateShelter);
router.delete("/:id", authMiddleware, adminMiddleware, deleteShelter);

export default router;
