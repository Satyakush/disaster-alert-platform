import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createResponseTask,
  getResponseTasks,
  updateResponseTask,
} from "../controllers/responseTaskController.js";

const router = express.Router();

router.get("/", authMiddleware, getResponseTasks);
router.post("/", authMiddleware, createResponseTask);
router.patch("/:id", authMiddleware, updateResponseTask);

export default router;
