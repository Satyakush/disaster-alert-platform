import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("SNS 2026 Backend Running");
});

export default app;
