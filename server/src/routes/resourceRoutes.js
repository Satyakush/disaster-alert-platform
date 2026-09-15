import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import responseTeamOnly from "../middlewares/responseTeamMiddleware.js";
import {
  createResource,
  deleteResource,
  getResources,
  updateResource,
} from "../controllers/resourceController.js";

const router = express.Router();

router.get("/", authMiddleware, responseTeamOnly, getResources);
router.post("/", authMiddleware, responseTeamOnly, createResource);
router.put("/:id", authMiddleware, responseTeamOnly, updateResource);
router.delete("/:id", authMiddleware, responseTeamOnly, deleteResource);

export default router;
