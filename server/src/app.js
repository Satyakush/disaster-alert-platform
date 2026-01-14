import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("SNS 2026 Backend Running");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);

export default app;
