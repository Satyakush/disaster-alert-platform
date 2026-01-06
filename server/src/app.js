import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import protectedRoute from "./routes/protectedRoute.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("SNS 2026 Backend Running");
});

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoute);


export default app;
