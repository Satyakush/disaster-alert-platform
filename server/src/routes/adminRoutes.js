import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminOnly from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Example admin-only API
router.get("/dashboard", authMiddleware, adminOnly, (req, res) => {
  res.json({
    message: "Welcome Admin",
    user: req.user,
  });
});

export default router;
