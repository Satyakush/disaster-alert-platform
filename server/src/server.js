import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";

const PORT = process.env.PORT || 5000;
const clientOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: clientOrigins,
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.emit("connection:ready", {
    connected: true,
    timestamp: new Date().toISOString(),
  });

  socket.on("alerts:join", () => {
    socket.join("alerts");
  });

  socket.on("alerts:leave", () => {
    socket.leave("alerts");
  });
});

connectDB();

app.use("/api/admin", adminRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/risk", riskRoutes);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
