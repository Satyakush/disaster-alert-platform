import Alert from "../models/alert.js";
import ResponseTask from "../models/responseTask.js";
import User from "../models/user.js";

const canAccessResponseTeam = (req) => ["responder", "admin"].includes(req.user.role);

export const getResponseTasks = async (req, res) => {
  try {
    if (!canAccessResponseTeam(req)) {
      return res.status(403).json({ message: "Responder or admin access required" });
    }

    const filter = req.user.role === "admin" && req.query.all === "true"
      ? {}
      : { responder: req.user.id };

    const tasks = await ResponseTask.find(filter)
      .populate("alert")
      .populate("responder", "name email role")
      .populate("assignedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load response tasks" });
  }
};

export const createResponseTask = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { alertId, responderId, priority, notes } = req.body;

    if (!alertId || !responderId) {
      return res.status(400).json({ message: "Alert and responder are required" });
    }

    const [alert, responder] = await Promise.all([
      Alert.findById(alertId),
      User.findById(responderId).select("name email role"),
    ]);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    if (!responder) {
      return res.status(404).json({ message: "Responder not found" });
    }

    if (responder.role !== "responder") {
      return res.status(400).json({ message: "Selected user is not an active responder" });
    }

    const existingTask = await ResponseTask.findOne({ alert: alertId, responder: responderId });
    if (existingTask) {
      return res.status(409).json({ message: "This responder is already assigned to the alert" });
    }

    const task = await ResponseTask.create({
      alert: alertId,
      responder: responderId,
      priority: priority || alert.severity || "medium",
      notes: notes || "",
      assignedBy: req.user.id,
    });

    const populatedTask = await ResponseTask.findById(task._id)
      .populate("alert")
      .populate("responder", "name email role")
      .populate("assignedBy", "name email role");

    req.app.get("io")?.to("alerts").emit("response-task:created", populatedTask);

    res.status(201).json({ task: populatedTask });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "This responder is already assigned to the alert" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to create response task" });
  }
};

export const updateResponseTask = async (req, res) => {
  try {
    if (!canAccessResponseTeam(req)) {
      return res.status(403).json({ message: "Responder or admin access required" });
    }

    const { id } = req.params;
    const task = await ResponseTask.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Response task not found" });
    }

    if (req.user.role !== "admin" && task.responder.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update your assigned tasks" });
    }

    const allowedStatuses = ["assigned", "acknowledged", "in_progress", "completed", "cancelled"];
    const { status, notes } = req.body;

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid task status" });
    }

    if (status) {
      task.status = status;
      task.completedAt = status === "completed" ? new Date() : undefined;
    }

    if (typeof notes === "string") {
      task.notes = notes.trim().slice(0, 2000);
    }

    await task.save();

    const populatedTask = await ResponseTask.findById(task._id)
      .populate("alert")
      .populate("responder", "name email role")
      .populate("assignedBy", "name email role");

    req.app.get("io")?.to("alerts").emit("response-task:updated", populatedTask);

    res.json({ task: populatedTask });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to update response task" });
  }
};
