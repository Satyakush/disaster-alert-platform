import Alert from "../models/alert.js";

const allowedUpdateFields = [
  "title",
  "description",
  "disasterType",
  "severity",
  "status",
  "location",
  "coordinates",
  "radius",
  "affectedArea",
  "source",
  "urgency",
  "certainty",
  "effectiveAt",
  "expiresAt",
  "instructions",
  "risk",
];

const pickFields = (body) =>
  Object.fromEntries(
    allowedUpdateFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]])
  );

const emitAlertEvent = (req, event, alert) => {
  const io = req.app.get("io");
  if (io) io.to("alerts").emit(event, alert);
};

export const createAlert = async (req, res) => {
  try {
    const {
      title,
      description,
      disasterType,
      severity,
      status,
      location,
      coordinates,
      radius,
      affectedArea,
      source,
      urgency,
      certainty,
      effectiveAt,
      expiresAt,
      instructions,
      risk,
    } = req.body;

    if (!title || !description || !disasterType || !location) {
      return res.status(400).json({
        message: "Title, description, disaster type, and location are required",
      });
    }

    const alert = await Alert.create({
      title,
      description,
      disasterType,
      severity,
      status,
      location,
      coordinates,
      radius,
      affectedArea,
      source,
      urgency,
      certainty,
      effectiveAt,
      expiresAt,
      instructions,
      risk,
      createdBy: req.user.id,
    });

    await alert.populate("createdBy", "name email role");
    emitAlertEvent(req, "alert:created", alert);

    return res.status(201).json({ message: "Alert created successfully", alert });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: "Server error while creating alert" });
  }
};

export const getAllAlerts = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.disasterType) filter.disasterType = req.query.disasterType;
    if (req.query.severity) filter.severity = req.query.severity;

    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role");

    return res.status(200).json({ count: alerts.length, alerts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while fetching alerts" });
  }
};

export const updateAlert = async (req, res) => {
  try {
    const updates = pickFields(req.body);

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No valid fields provided" });
    }

    const alert = await Alert.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email role");

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    emitAlertEvent(req, "alert:updated", alert);
    return res.status(200).json({ message: "Alert updated successfully", alert });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: "Update failed" });
  }
};

export const updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email role");

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    emitAlertEvent(req, "alert:status-changed", alert);
    return res.status(200).json({ message: "Alert status updated successfully", alert });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: "Failed to update alert status" });
  }
};

export const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    emitAlertEvent(req, "alert:deleted", { id: alert._id });
    return res.status(200).json({ message: "Alert deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Delete failed" });
  }
};
