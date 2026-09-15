import express from "express";
import { createInfrastructure, deleteInfrastructure, getInfrastructure, updateInfrastructure } from "../controllers/infrastructureController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getInfrastructure);
router.post("/", authMiddleware, adminMiddleware, createInfrastructure);
router.put("/:id", authMiddleware, adminMiddleware, updateInfrastructure);
router.delete("/:id", authMiddleware, adminMiddleware, deleteInfrastructure);

export default router;
