import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminOnly from "../middlewares/adminMiddleware.js";
import { assignResponderRole, getResponseTeam, revokeResponderRole } from "../controllers/responseTeamController.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, adminOnly, (req, res) => {
  res.json({
    message: "Welcome Admin",
    user: req.user,
  });
});

router.get("/response-team", authMiddleware, adminOnly, getResponseTeam);
router.patch("/response-team/:id/assign", authMiddleware, adminOnly, assignResponderRole);
router.patch("/response-team/:id/revoke", authMiddleware, adminOnly, revokeResponderRole);

export default router;
