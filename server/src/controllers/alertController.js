import Alert from "../models/alert.js";

/**
 * @desc    Create a new disaster alert
 * @route   POST /api/alerts
 * @access  Admin only
 */
export const createAlert = async (req, res) => {
  try {
    const { title, description, disasterType, severity, location } = req.body;


    // Basic validation
    if (!title || !description || !disasterType || !location) {
      return res.status(400).json({
        message: "All required fields must be provided",
      });
    }

    const alert = await Alert.create({
      title,
      description,
      disasterType,
      severity,
      location,
      createdBy: req.user.id, // comes from authMiddleware
    });

    return res.status(201).json({
      message: "Alert created successfully",
      alert,
    });
  } catch (error) {
    console.error("Create Alert Error:", error);
    return res.status(500).json({
      message: "Server error while creating alert",
    });
  }
};

/**
 * @desc    Get all disaster alerts
 * @route   GET /api/alerts
 * @access  Public
 */
export const getAllAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role");

    return res.status(200).json({
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error("Get Alerts Error:", error);
    return res.status(500).json({
      message: "Server error while fetching alerts",
    });
  }
};
// UPDATE ALERT
export const updateAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.json({
      message: "Alert updated successfully",
      alert,
    });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

// DELETE ALERT
export const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.json({ message: "Alert deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};


