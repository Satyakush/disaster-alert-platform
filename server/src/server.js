import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";

const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Register routes BEFORE listen
app.use("/api/admin", adminRoutes);
app.use("/api/alerts", alertRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
