import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import cors from "cors";

dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use("/api/admin", adminRoutes);
app.use("/api/alerts", alertRoutes);